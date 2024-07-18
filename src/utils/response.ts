import type {
  H3Event,
  ResponseHeaders,
  ResponseHeaderName,
  MimeType,
  StatusCode,
} from "../types";
import { MIMES } from "./internal/consts";
import { sanitizeStatusCode, sanitizeStatusMessage } from "./sanitize";
import {
  serializeIterableValue,
  coerceIterable,
  IterationSource,
  IteratorSerializer,
} from "./internal/iterable";
import { NodeEvent } from "../types/node";
import { kNodeRes } from "../adapters/node/internal/utils";

/**
 * Respond with an empty payload.<br>
 *
 * @example
 * app.use("/", () => noContent());
 *
 * @param event H3 event
 * @param code status code to be send. By default, it is `204 No Content`.
 */
export function noContent(event: H3Event, code?: StatusCode) {
  const currentStatus = event.response.status;

  if (!code && currentStatus && currentStatus !== 200) {
    code = event.response.status;
  }

  event.response.status = sanitizeStatusCode(code, 204);

  // 204 responses MUST NOT have a Content-Length header field
  // https://www.rfc-editor.org/rfc/rfc7230#section-3.3.2
  if (event.response.status === 204) {
    event.response.headers.delete("content-length");
  }

  return "";
}

/**
 * Set the response status code and message.
 *
 * @example
 * app.use("/", (event) => {
 *   setResponseStatus(event, 404, "Not Found");
 *   return "Not Found";
 * });
 */
export function setResponseStatus(
  event: H3Event,
  code?: StatusCode,
  text?: string,
): void {
  if (code) {
    event.response.status = sanitizeStatusCode(code, event.response.status);
  }
  if (text) {
    event.response.statusText = sanitizeStatusMessage(text);
  }
}

/**
 * Get the current response status code.
 *
 * @example
 * app.use("/", (event) => {
 *   const status = getResponseStatus(event);
 *   return `Status: ${status}`;
 * });
 */
export function getResponseStatus(event: H3Event): number {
  return event.response.status || 200;
}

/**
 * Get the current response status message.
 *
 * @example
 * app.use("/", (event) => {
 *   const statusText = getResponseStatusText(event);
 *   return `Status: ${statusText}`;
 * });
 */
export function getResponseStatusText(event: H3Event): string {
  return event.response.statusText || "";
}

/**
 * Set the response status code and message.
 */
export function defaultContentType(event: H3Event, type?: MimeType) {
  if (
    type &&
    event.response.status !== 304 /* unjs/h3#603 */ &&
    !event.response.headers.get("content-type")
  ) {
    event.response.headers.set("content-type", type);
  }
}

/**
 * Send a redirect response to the client.
 *
 * It adds the `location` header to the response and sets the status code to 302 by default.
 *
 * In the body, it sends a simple HTML page with a meta refresh tag to redirect the client in case the headers are ignored.
 *
 * @example
 * app.use("/", (event) => {
 *   return redirect(event, "https://example.com");
 * });
 *
 * @example
 * app.use("/", (event) => {
 *   return redirect(event, "https://example.com", 301); // Permanent redirect
 * });
 */
export function redirect(
  event: H3Event,
  location: string,
  code: StatusCode = 302,
) {
  event.response.status = sanitizeStatusCode(code, event.response.status);
  event.response.headers.set("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  defaultContentType(event, MIMES.html);
  return html;
}

/**
 * Get the response headers object.
 *
 * @example
 * app.use("/", (event) => {
 *   const headers = getResponseHeaders(event);
 * });
 */
export function getResponseHeaders(event: H3Event): Record<string, string> {
  return Object.fromEntries(event.response.headers.entries());
}

export function getResponseHeader(
  event: H3Event,
  name: string,
): string | undefined {
  return event.response.headers.get(name) || undefined;
}

/**
 * Set the response headers.
 *
 * @example
 * app.use("/", (event) => {
 *   setResponseHeaders(event, {
 *     "content-type": "text/html",
 *     "cache-control": "no-cache",
 *   });
 * });
 */
export function setResponseHeaders(
  event: H3Event,
  headers: ResponseHeaders,
): void {
  for (const [name, value] of Object.entries(headers)) {
    event.response.headers.set(name, value!);
  }
}

/**
 * Set a response header by name.
 *
 * @example
 * app.use("/", (event) => {
 *   setResponseHeader(event, "content-type", "text/html");
 * });
 */
export function setResponseHeader<T extends keyof ResponseHeaders>(
  event: H3Event,
  name: T,
  value: ResponseHeaders[T] | ResponseHeaders[T][],
): void {
  if (Array.isArray(value)) {
    event.response.headers.delete(name);
    for (const valueItem of value) {
      event.response.headers.append(name, valueItem!);
    }
  } else {
    event.response.headers.set(name, value!);
  }
}

/**
 * Append the response headers.
 *
 * @example
 * app.use("/", (event) => {
 *   appendResponseHeaders(event, {
 *     "content-type": "text/html",
 *     "cache-control": "no-cache",
 *   });
 * });
 */
export function appendResponseHeaders(
  event: H3Event,
  headers: ResponseHeaders,
): void {
  for (const [name, value] of Object.entries(headers)) {
    appendResponseHeader(event, name, value!);
  }
}

/**
 * Append a response header by name.
 *
 * @example
 * app.use("/", (event) => {
 *   appendResponseHeader(event, "content-type", "text/html");
 * });
 */
export function appendResponseHeader<T extends string>(
  event: H3Event,
  name: T,
  value: ResponseHeaders[T] | ResponseHeaders[T][],
): void {
  if (Array.isArray(value)) {
    for (const valueItem of value) {
      event.response.headers.append(name, valueItem!);
    }
  } else {
    event.response.headers.append(name, value!);
  }
}

/**
 * Remove all response headers, or only those specified in the headerNames array.
 *
 * @example
 * app.use("/", (event) => {
 *   clearResponseHeaders(event, ["content-type", "cache-control"]); // Remove content-type and cache-control headers
 * });
 *
 * @param event H3 event
 * @param headerNames Array of header names to remove
 */
export function clearResponseHeaders(
  event: H3Event,
  headerNames?: ResponseHeaderName[],
): void {
  if (headerNames && headerNames.length > 0) {
    for (const name of headerNames) {
      event.response.headers.delete(name);
    }
  } else {
    for (const name of event.response.headers.keys()) {
      event.response.headers.delete(name);
    }
  }
}

/**
 * Remove a response header by name.
 *
 * @example
 * app.use("/", (event) => {
 *   removeResponseHeader(event, "content-type"); // Remove content-type header
 * });
 */
export function removeResponseHeader(
  event: H3Event,
  name: ResponseHeaderName,
): void {
  return event.response.headers.delete(name);
}

/**
 * Write `HTTP/1.1 103 Early Hints` to the client.
 */
export function writeEarlyHints(
  event: H3Event,
  hints: Record<string, string>,
): void | Promise<void> {
  return event.node?.res.writeEarlyHints(hints);
}

/**
 * Iterate a source of chunks and send back each chunk in order.
 * Supports mixing async work together with emitting chunks.
 *
 * Each chunk must be a string or a buffer.
 *
 * For generator (yielding) functions, the returned value is treated the same as yielded values.
 *
 * @param event - H3 event
 * @param iterable - Iterator that produces chunks of the response.
 * @param serializer - Function that converts values from the iterable into stream-compatible values.
 * @template Value - Test
 *
 * @example
 * return iterable(async function* work() {
 *   // Open document body
 *   yield "<!DOCTYPE html>\n<html><body><h1>Executing...</h1><ol>\n";
 *   // Do work ...
 *   for (let i = 0; i < 1000) {
 *     await delay(1000);
 *     // Report progress
 *     yield `<li>Completed job #`;
 *     yield i;
 *     yield `</li>\n`;
 *   }
 *   // Close out the report
 *   return `</ol></body></html>`;
 * })
 * async function delay(ms) {
 *   return new Promise(resolve => setTimeout(resolve, ms));
 * }
 */
export function iterable<Value = unknown, Return = unknown>(
  iterable: IterationSource<Value, Return>,
  options?: {
    serializer: IteratorSerializer<Value | Return>;
  },
): ReadableStream {
  const serializer = options?.serializer ?? serializeIterableValue;
  const iterator = coerceIterable(iterable);
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (value !== undefined) {
        const chunk = serializer(value);
        if (chunk !== undefined) {
          controller.enqueue(chunk);
        }
      }
      if (done) {
        controller.close();
      }
    },
    cancel() {
      iterator.return?.();
    },
  });
}
