import { RawEvent } from "../../types/_event";
import { HTTPMethod } from "../../types";
import { hasProp } from "../../utils/internal/object";

import type {
  NodeIncomingMessage,
  NodeReadableStream,
  NodeServerResponse,
} from "./types";

export class NodeEvent implements RawEvent {
  static isNode = true;

  req: NodeIncomingMessage;
  res: NodeServerResponse;

  _handled?: boolean;

  constructor(req: NodeIncomingMessage, res: NodeServerResponse) {
    this.req = req;
    this.res = res;
  }

  // -- request --

  get method() {
    return this.req.method as HTTPMethod;
  }

  get path() {
    return this.req.url || "/";
  }

  set path(path: string) {
    this.req.url = path;
  }

  getHeader(key: string) {
    const value = this.req.headers[key];
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return value;
  }

  getHeaders() {
    return _normalizeHeaders(this.req.headers);
  }

  get remoteAddress() {
    return this.req.socket.remoteAddress;
  }

  get isSecure() {
    return (this.req.connection as any).encrypted;
  }

  // -- response --

  get responseCode() {
    return this.res.statusCode || 200;
  }

  set responseCode(code: number) {
    this.res.statusCode = code;
  }

  get responseMessage() {
    return this.res.statusMessage;
  }

  set responseMessage(message: string) {
    this.res.statusMessage = message;
  }

  setResponseHeader(key: string, value: string) {
    this.res.setHeader(key, value);
  }

  appendResponseHeader(key: string, value: string) {
    this.res.appendHeader(key, value);
  }

  getResponseHeader(key: string) {
    const value = this.res.getHeader(key);
    if (!value) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return value as string;
  }

  getResponseHeaders() {
    return _normalizeHeaders(this.res.getHeaders());
  }

  getResponseSetCookie() {
    const value = this.res.getHeader("set-cookie");
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value as string];
  }

  removeResponseHeader(key: string) {
    this.res.removeHeader(key);
  }

  writeHead(code: number, message?: string) {
    this.res.writeHead(code, message);
  }

  sendResponse(body?: unknown) {
    this.res.end(body);
  }

  sendStream(stream: NodeReadableStream | ReadableStream) {
    // Validate input
    if (!stream || typeof stream !== "object") {
      throw new Error("[h3] Invalid stream provided.");
    }

    // Directly expose stream for worker environments (unjs/unenv)
    (this.res as unknown as { _data: BodyInit })._data = stream as BodyInit;

    // Early return if response Socket is not available for worker environments (unjs/nitro)
    if (!this.res.socket) {
      this._handled = true;
      // TODO: Hook and handle stream errors
      return Promise.resolve();
    }

    // Native Web Streams
    if (
      hasProp(stream, "pipeTo") &&
      typeof (stream as ReadableStream).pipeTo === "function"
    ) {
      return (stream as ReadableStream)
        .pipeTo(
          new WritableStream({
            write: (chunk) => {
              this.res.write(chunk);
            },
          }),
        )
        .then(() => {
          this.res.end();
        });
    }

    // Node.js Readable Streams
    // https://nodejs.org/api/stream.html#readable-streams
    if (
      hasProp(stream, "pipe") &&
      typeof (stream as NodeReadableStream).pipe === "function"
    ) {
      return new Promise<void>((resolve, reject) => {
        // Pipe stream to response
        (stream as NodeReadableStream).pipe(this.res);

        // Handle stream events (if supported)
        if ((stream as NodeReadableStream).on) {
          (stream as NodeReadableStream).on("end", () => {
            this.res.end();
            resolve();
          });
          (stream as NodeReadableStream).on("error", (error: Error) => {
            reject(error);
          });
        }

        // Handle request aborts
        this.res.on("close", () => {
          // https://react.dev/reference/react-dom/server/renderToPipeableStream
          if ((stream as any).abort) {
            (stream as any).abort();
          }
        });
      });
    }

    throw new Error("[h3] Invalid or incompatible stream provided.");
  }

  writeEarlyHints(hints: Record<string, string | string[]>) {
    if (this.res.writeEarlyHints) {
      return new Promise<void>((resolve) => {
        return this.res.writeEarlyHints(hints, resolve);
      });
    }
  }
}

// --- Internal ---

function _normalizeHeaders(
  headers: Record<string, string | null | undefined | number | string[]>,
): Record<string, string> {
  const normalized: Record<string, string> = Object.create(null);
  for (const [key, value] of Object.entries(headers)) {
    normalized[key] = Array.isArray(value)
      ? value.join(", ")
      : (value as string);
  }
  return normalized;
}
