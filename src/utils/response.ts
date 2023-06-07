import type { Socket } from "node:net";
import { createError } from "../error";
import type { H3Event } from "../event";
import { MIMES } from "./consts";
import { sanitizeStatusCode, sanitizeStatusMessage } from "./sanitize";
import {
  getResponseHeaders,
  setResponseHeader,
  removeResponseHeader,
  getResponseHeader,
} from "./headers";

export function getResponseStatus(event: H3Event): number {
  if (event.request) {
    return event._internalData.status;
  }
  return event.node.res.statusCode;
}

export function getResponseStatusText(event: H3Event): string {
  if (event.request) {
    return event._internalData.statusMessage;
  }
  return event.node.res.statusMessage;
}

export function setResponseStatus(
  event: H3Event,
  code?: number,
  text?: string
): void {
  if (event.request) {
    if (code) {
      event._internalData.status = sanitizeStatusCode(code);
    }
    if (text) {
      event._internalData.statusMessage = sanitizeStatusMessage(text);
    }
    return;
  }
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}

const defer =
  typeof setImmediate !== "undefined" ? setImmediate : (fn: () => any) => fn();

export function send(event: H3Event, data?: any, type?: string) {
  if (type) {
    defaultContentType(event, type);
  }
  if (event.request) {
    return sendResponseWithInternal(event, new Response(data));
  }
  return new Promise<void>((resolve) => {
    defer(() => {
      event.node.res.end(data);
      resolve();
    });
  });
}

export function sendResponseWithInternal(event: H3Event, response: Response) {
  const mergedHeaders = new Map();
  for (const [key, value] of response.headers.entries()) {
    mergedHeaders.set(key, value);
  }
  for (const [key, value] of Object.entries(getResponseHeaders(event))) {
    mergedHeaders.set(key, value);
  }
  const headers = Object.fromEntries(mergedHeaders);
  return new Response(response.body, {
    ...response,
    status: getResponseStatus(event) || response.status,
    headers,
  });
}

/**
 * Respond with an empty payload.<br>
 * Note that calling this function will close the connection and no other data can be sent to the client afterwards.
 *
 * @param event H3 event
 * @param code status code to be send. By default, it is `204 No Content`.
 */
export function sendNoContent(event: H3Event, code = 204) {
  setResponseStatus(event, code);
  // 204 responses MUST NOT have a Content-Length header field (https://www.rfc-editor.org/rfc/rfc7230#section-3.3.2)
  if (code === 204) {
    removeResponseHeader(event, "content-length");
  }
  return send(event, null);
}

export function defaultContentType(event: H3Event, type?: string) {
  if (type) {
    const contentType = getResponseHeader(event, "content-type");
    if (!contentType) {
      setResponseHeader(event, "content-type", type);
    }
  }
}

export function sendRedirect(event: H3Event, location: string, code = 302) {
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  setResponseStatus(event, code);
  setResponseHeader(event, "location", location);
  return send(event, html, MIMES.html);
}

const noop = () => {};
// Node only
export function writeEarlyHints(
  event: H3Event,
  hints: string | string[] | Record<string, string | string[]>,
  cb: () => void = noop
) {
  if (!event.node.res.socket /* && !('writeEarlyHints' in event.node.res) */) {
    cb();
    return;
  }

  // Normalize if string or string[] is provided
  if (typeof hints === "string" || Array.isArray(hints)) {
    hints = { link: hints };
  }

  if (hints.link) {
    hints.link = Array.isArray(hints.link) ? hints.link : hints.link.split(",");
    // TODO: remove when https://github.com/nodejs/node/pull/44874 is released
    // hints.link = hints.link.map(l => l.trim().replace(/; crossorigin/g, ''))
  }

  // TODO: Enable when node 18 api is stable
  // if ('writeEarlyHints' in event.node.res) {
  //   return event.node.res.writeEarlyHints(hints, cb)
  // }

  const headers: [string, string | string[]][] = Object.entries(hints).map(
    (e) => [e[0].toLowerCase(), e[1]]
  );
  if (headers.length === 0) {
    cb();
    return;
  }

  let hint = "HTTP/1.1 103 Early Hints";
  if (hints.link) {
    hint += `\r\nLink: ${(hints.link as string[]).join(", ")}`;
  }

  for (const [header, value] of headers) {
    if (header === "link") {
      continue;
    }
    hint += `\r\n${header}: ${value}`;
  }
  if (event.node.res.socket) {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    (event.node.res as { socket: Socket }).socket.write(
      `${hint}\r\n\r\n`,
      "utf8",
      cb
    );
  } else {
    cb();
  }
}

// Node only
export function isStream(data: any) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.pipe === "function" &&
    typeof data.on === "function"
  );
}

// Node only
export function sendStream(event: H3Event, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    data.pipe(event.node.res);
    data.on("end", () => resolve());
    data.on("error", (error: Error) => reject(createError(error)));
  });
}
