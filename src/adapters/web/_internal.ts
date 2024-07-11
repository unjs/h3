import type { Readable as NodeReadableStream } from "node:stream";
import type { ResponseBody } from "../../types";
import { _kRaw } from "../../event";
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
