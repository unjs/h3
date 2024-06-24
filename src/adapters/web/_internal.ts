import type { Readable as NodeReadableStream } from "node:stream";
import type { App, EventHandler, H3EventContext } from "../../types";
import type { RawResponse } from "../../types/event";
import { EventWrapper, _kRaw } from "../../event";
import { WebEvent } from "./event";
import { createError, errorToResponse, isError } from "../../error";

export function _normalizeResponse(data: RawResponse) {
  // Node.js Readable Streams
  // https://nodejs.org/api/stream.html#readable-streams
  if (typeof (data as NodeReadableStream)?.pipe === "function") {
    // Convert to a ReadableStream
    return new ReadableStream({
      start(controller) {
        (data as NodeReadableStream).on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        (data as NodeReadableStream).on("end", () => {
          controller.close();
        });
      },
    });
  }
  return data as Exclude<RawResponse, NodeReadableStream>;
}

export function _pathToRequestURL(path: string, headers?: HeadersInit): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const h = headers instanceof Headers ? headers : new Headers(headers);
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost";
  const protocol = h.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${protocol}://${host}${path}`;
}

export const nullBodyResponses = new Set([101, 204, 205, 304]);

export async function _callWithWebRequest(
  handler: EventHandler,
  request: Request,
  context?: H3EventContext,
  app?: App,
) {
  const rawEvent = new WebEvent(request);
  const event = new EventWrapper(rawEvent);

  if (context) {
    Object.assign(event.context, context);
  }

  let error;

  try {
    await handler(event);
  } catch (_error: any) {
    error = createError(_error);
    if (!isError(_error)) {
      error.unhandled = true;
    }
  }

  if (error) {
    if (error.unhandled || error.fatal) {
      console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
    }
    if (app?.options.onError) {
      await app?.options.onError(error, event);
    }
    const errRes = errorToResponse(error, app?.options.debug);
    return {
      status: errRes.status,
      statusText: errRes.statusText,
      headers: new Headers(errRes.headers),
      body: errRes.body,
    };
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Response/body
  const responseBody =
    nullBodyResponses.has(rawEvent.responseCode!) || request.method === "HEAD"
      ? null
      : _normalizeResponse(rawEvent._responseBody);

  return {
    status: rawEvent.responseCode,
    statusText: rawEvent.responseMessage,
    headers: rawEvent._responseHeaders,
    body: responseBody,
  };
}
