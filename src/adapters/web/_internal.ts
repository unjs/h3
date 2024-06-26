import type { Readable as NodeReadableStream } from "node:stream";
import type { App, H3EventContext, ResponseBody } from "../../types";
import { EventWrapper, _kRaw } from "../../event";
import { WebEvent } from "./event";

type WebNormalizedResponseBody = Exclude<ResponseBody, NodeReadableStream>;

export function _normalizeResponse(
  data: ResponseBody,
): WebNormalizedResponseBody {
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
  return data as WebNormalizedResponseBody;
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

export async function appFetch(
  app: App,
  request: Request,
  context?: H3EventContext,
): Promise<{
  body: WebNormalizedResponseBody;
  status: Response["status"];
  statusText: Response["statusText"];
  headers: Headers;
}> {
  const rawEvent = new WebEvent(request);
  const event = new EventWrapper(rawEvent, context);

  const _appResponseBody = await app.handler(event);

  // https://developer.mozilla.org/en-US/docs/Web/API/Response/body
  const responseBody =
    nullBodyResponses.has(rawEvent.responseCode!) || request.method === "HEAD"
      ? null
      : _normalizeResponse(_appResponseBody);

  return {
    status: rawEvent.responseCode,
    statusText: rawEvent.responseMessage,
    headers: rawEvent._responseHeaders,
    body: responseBody,
  };
}
