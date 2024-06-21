import type { Readable as NodeReadableStream } from "node:stream";
import type { App } from "../app";
import type { H3EventContext } from "../types";
import type { RawResponse } from "../types/_event";
import { createError, isError, sendError } from "../error";
import { EventWrapper, _kRaw } from "../event";
import { WebEvent } from "./event";

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

const nullBodyResponses = new Set([101, 204, 205, 304]);

export async function _handleWebRequest(
  app: App,
  request: Request,
  context?: H3EventContext,
) {
  const rawEvent = new WebEvent(request);
  const event = new EventWrapper(rawEvent);

  if (context) {
    Object.assign(event.context, context);
  }

  try {
    await app.handler(event);
  } catch (_error: any) {
    const error = createError(_error);
    if (!isError(_error)) {
      error.unhandled = true;
    }
    if (app.options.onError) {
      await app.options.onError(error, event);
    }
    if (!event[_kRaw].handled) {
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      await sendError(event, error, !!app.options.debug);
    }
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Response/body
  const body =
    nullBodyResponses.has(rawEvent.responseCode!) || request.method === "HEAD"
      ? null
      : _normalizeResponse(rawEvent._responseBody);

  return {
    body,
    status: rawEvent.responseCode,
    statusText: rawEvent.responseMessage,
    headers: rawEvent._responseHeaders,
  };
}
