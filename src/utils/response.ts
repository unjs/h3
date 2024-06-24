import type { H3Event } from "../types";
import type { ResponseHeaders, ResponseHeaderName } from "../types/http";
import type { MimeType, StatusCode } from "../types";
import { _kRaw } from "../event";
import { MIMES } from "./internal/consts";
import { sanitizeStatusCode, sanitizeStatusMessage } from "./sanitize";
import { splitCookiesString } from "./cookie";
import {
  serializeIterableValue,
  coerceIterable,
  IterationSource,
  IteratorSerializer,
} from "./internal/iterable";

/**
 * Respond with an empty payload.<br>
 *
 * Note that calling this function will close the connection and no other data can be sent to the client afterwards.
 *
 * @example
 * export default defineEventHandler((event) => {
 *   return sendNoContent(event);
 * });
 * @example
 * export default defineEventHandler((event) => {
 *   sendNoContent(event); // Close the connection
 *   console.log("This will not be executed");
 * });
 *
 * @param event H3 event
 * @param code status code to be send. By default, it is `204 No Content`.
 */
export function sendNoContent(event: H3Event, code?: StatusCode) {
  if (event[_kRaw].handled) {
    return;
  }

  if (!code && event[_kRaw].responseCode !== 200) {
    // status code was set with setResponseStatus
    code = event[_kRaw].responseCode;
  }
  const _code = sanitizeStatusCode(code, 204);
  // 204 responses MUST NOT have a Content-Length header field
  // https://www.rfc-editor.org/rfc/rfc7230#section-3.3.2
  if (_code === 204) {
    event[_kRaw].removeResponseHeader("content-length");
  }
  event[_kRaw].writeHead(_code);
  event[_kRaw].sendResponse();
}

/**
 * Set the response status code and message.
 *
 * @example
 * export default defineEventHandler((event) => {
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
    event[_kRaw].responseCode = sanitizeStatusCode(
      code,
      event[_kRaw].responseCode,
    );
  }
  if (text) {
    event[_kRaw].responseMessage = sanitizeStatusMessage(text);
  }
}

/**
 * Get the current response status code.
 *
 * @example
 * export default defineEventHandler((event) => {
 *   const status = getResponseStatus(event);
 *   return `Status: ${status}`;
 * });
 */
export function getResponseStatus(event: H3Event): number {
  return event[_kRaw].responseCode || 200;
}

/**
 * Get the current response status message.
 *
 * @example
 * export default defineEventHandler((event) => {
 *   const statusText = getResponseStatusText(event);
 *   return `Status: ${statusText}`;
 * });
 */
export function getResponseStatusText(event: H3Event): string {
  return event[_kRaw].responseMessage || "";
}

/**
 * Set the response status code and message.
 */
export function defaultContentType(event: H3Event, type?: MimeType) {
  if (
    type &&
    event[_kRaw].responseCode !== 304 /* unjs/h3#603 */ &&
    !event[_kRaw].getResponseHeader("content-type")
  ) {
    event[_kRaw].setResponseHeader("content-type", type);
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
 * export default defineEventHandler((event) => {
 *   return sendRedirect(event, "https://example.com");
 * });
 *
 * @example
 * export default defineEventHandler((event) => {
 *   return sendRedirect(event, "https://example.com", 301); // Permanent redirect
 * });
 */
export function sendRedirect(
  event: H3Event,
  location: string,
  code: StatusCode = 302,
) {
  event[_kRaw].responseCode = sanitizeStatusCode(
    code,
    event[_kRaw].responseCode,
  );
  event[_kRaw].setResponseHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  defaultContentType(event, MIMES.html);
  return event[_kRaw].sendResponse(html);
}

/**
 * Get the response headers object.
 *
 * @example
 * export default defineEventHandler((event) => {
 *   const headers = getResponseHeaders(event);
 * });
 */
export function getResponseHeaders(event: H3Event) {
  return event[_kRaw].getResponseHeaders();
}

export function getResponseHeader(event: H3Event, name: string) {
  return event[_kRaw].getResponseHeader(name);
}

/**
 * Set the response headers.
 *
 * @example
 * export default defineEventHandler((event) => {
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
    event[_kRaw].setResponseHeader(name, value!);
  }
}

/**
 * Set a response header by name.
 *
 * @example
 * export default defineEventHandler((event) => {
 *   setResponseHeader(event, "content-type", "text/html");
 * });
 */
export function setResponseHeader<T extends keyof ResponseHeaders>(
  event: H3Event,
  name: T,
  value: ResponseHeaders[T] | ResponseHeaders[T][],
): void {
  if (Array.isArray(value)) {
    event[_kRaw].removeResponseHeader(name);
    for (const valueItem of value) {
      event[_kRaw].appendResponseHeader(name, valueItem!);
    }
  } else {
    event[_kRaw].setResponseHeader(name, value!);
  }
}

/**
 * Append the response headers.
 *
 * @example
 * export default defineEventHandler((event) => {
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
 * export default defineEventHandler((event) => {
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
      event[_kRaw].appendResponseHeader(name, valueItem!);
    }
  } else {
    event[_kRaw].appendResponseHeader(name, value!);
  }
}

/**
 * Remove all response headers, or only those specified in the headerNames array.
 *
 * @example
 * export default defineEventHandler((event) => {
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
      event[_kRaw].removeResponseHeader(name);
    }
  } else {
    for (const name of event[_kRaw].getResponseHeaders().keys()) {
      event[_kRaw].removeResponseHeader(name);
    }
  }
}

/**
 * Remove a response header by name.
 *
 * @example
 * export default defineEventHandler((event) => {
 *   removeResponseHeader(event, "content-type"); // Remove content-type header
 * });
 */
export function removeResponseHeader(
  event: H3Event,
  name: ResponseHeaderName,
): void {
  return event[_kRaw].removeResponseHeader(name);
}

/**
 * Write `HTTP/1.1 103 Early Hints` to the client.
 */
export function writeEarlyHints(
  event: H3Event,
  hints: Record<string, string>,
): void | Promise<void> {
  return event[_kRaw].writeEarlyHints(hints);
}

/**
 * Send a Web besponse object to the client.
 */
export function sendWebResponse(
  event: H3Event,
  response: Response,
): void | Promise<void> {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      for (const setCookie of splitCookiesString(value)) {
        event[_kRaw].appendResponseHeader(key, setCookie);
      }
    } else {
      event[_kRaw].setResponseHeader(key, value);
    }
  }

  if (response.status) {
    event[_kRaw].responseCode = sanitizeStatusCode(
      response.status,
      event[_kRaw].responseCode,
    );
  }
  if (response.statusText) {
    event[_kRaw].responseMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event[_kRaw].setResponseHeader("location", response.url);
  }
  return event[_kRaw].sendResponse(response.body);
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
 * sendIterable(event, work());
 * async function* work() {
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
 * }
 * async function delay(ms) {
 *   return new Promise(resolve => setTimeout(resolve, ms));
 * }
 */
export function sendIterable<Value = unknown, Return = unknown>(
  event: H3Event,
  iterable: IterationSource<Value, Return>,
  options?: {
    serializer: IteratorSerializer<Value | Return>;
  },
): void | Promise<void> {
  const serializer = options?.serializer ?? serializeIterableValue;
  const iterator = coerceIterable(iterable);
  event[_kRaw].sendResponse(
    new ReadableStream({
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
    }),
  );
}
