import { RawEvent } from "../../types/_event";
import { HTTPMethod } from "../../types";

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

  _rawBody?: Promise<undefined | Uint8Array>;
  _textBody?: Promise<undefined | string>;
  _formDataBody?: Promise<undefined | FormData>;
  _bodyStream?: undefined | ReadableStream<Uint8Array>;

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

  readRawBody() {
    if (!this._rawBody) {
      this._rawBody = _readBody(this.req);
    }
    return this._rawBody;
  }

  readTextBody() {
    if (this._textBody) {
      return this._textBody;
    }
    this._textBody = Promise.resolve(this.readRawBody()).then((body) =>
      body ? new TextDecoder().decode(body) : "",
    );
    return this._textBody;
  }

  async readFormDataBody() {
    if (!this._formDataBody) {
      this._formDataBody = Promise.resolve(this.readRawBody()).then((body) =>
        body ? new Response(body).formData() : undefined,
      );
    }
    return this._formDataBody;
  }

  readBodyStream() {
    if (!this._bodyStream) {
      this._bodyStream = _readBodyStream(this.req);
    }
    return this._bodyStream;
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
    return _sendStream(this.res, stream);
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

const payloadMethods = ["PATCH", "POST", "PUT", "DELETE"] as string[];

function _readBody(
  req: NodeIncomingMessage,
): undefined | Promise<Uint8Array | undefined> {
  // Check if request method requires a payload
  if (!req.method || !payloadMethods.includes(req.method?.toUpperCase())) {
    return;
  }

  // Make sure either content-length or transfer-encoding/chunked is set
  if (!Number.parseInt(req.headers["content-length"] || "")) {
    const isChunked = (req.headers["transfer-encoding"] || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)
      .includes("chunked");
    if (!isChunked) {
      return;
    }
  }

  // Read body
  return new Promise((resolve, reject) => {
    const bodyData: any[] = [];
    req
      .on("data", (chunk) => {
        bodyData.push(chunk);
      })
      .once("error", (err) => {
        reject(err);
      })
      .once("end", () => {
        resolve(Buffer.concat(bodyData));
      });
  });
}

function _readBodyStream(req: NodeIncomingMessage): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      req.once("end", () => {
        controller.close();
      });
      req.once("error", (err) => {
        controller.error(err);
      });
    },
  });
}

function _sendStream(
  res: NodeServerResponse,
  stream: ReadableStream | NodeReadableStream,
) {
  // Native Web Streams
  // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
  if (
    (stream as ReadableStream)?.pipeTo &&
    typeof (stream as ReadableStream).pipeTo === "function"
  ) {
    return (stream as ReadableStream)
      .pipeTo(
        new WritableStream({
          write: (chunk) => {
            res.write(chunk);
          },
        }),
      )
      .then(() => {
        res.end();
      });
  }

  // Node.js Readable Streams
  // https://nodejs.org/api/stream.html#readable-streams
  if (
    (stream as NodeReadableStream)?.pipe &&
    typeof (stream as NodeReadableStream).pipe === "function"
  ) {
    return new Promise<void>((resolve, reject) => {
      // Pipe stream to response
      (stream as NodeReadableStream).pipe(res);

      // Handle stream events (if supported)
      if ((stream as NodeReadableStream).on) {
        (stream as NodeReadableStream).on("end", () => {
          res.end();
          resolve();
        });
        (stream as NodeReadableStream).on("error", (error: Error) => {
          reject(error);
        });
      }

      // Handle request aborts
      res.on("close", () => {
        // https://react.dev/reference/react-dom/server/renderToPipeableStream
        if ((stream as any).abort) {
          (stream as any).abort();
        }
      });
    });
  }

  throw new Error(`[h3] Invalid or incompatible stream: ${stream}`);
}
