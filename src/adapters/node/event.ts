import type { Readable as NodeReadableStream } from "node:stream";
import { RawEvent, type RawResponse } from "../../types/_event";
import { HTTPMethod } from "../../types";

import type { NodeIncomingMessage, NodeServerResponse } from "./types";

export class NodeEvent implements RawEvent {
  static isNode = true;

  _req: NodeIncomingMessage;
  _res: NodeServerResponse;

  _originalPath?: string | undefined;

  _rawBody?: Promise<undefined | Uint8Array>;
  _textBody?: Promise<undefined | string>;
  _formDataBody?: Promise<undefined | FormData>;
  _bodyStream?: undefined | ReadableStream<Uint8Array>;

  constructor(req: NodeIncomingMessage, res: NodeServerResponse) {
    this._req = req;
    this._res = res;
  }

  getContext() {
    return {
      req: this._req,
      res: this._res,
    };
  }

  // -- request --

  get method() {
    return this._req.method as HTTPMethod;
  }

  get path() {
    return this._req.url || "/";
  }

  set path(path: string) {
    if (!this.originalPath) {
      this._originalPath = this.path;
    }
    this._req.url = path;
  }

  get originalPath() {
    return this._originalPath || this.path;
  }

  getHeader(key: string) {
    const value = this._req.headers[key];
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return value;
  }

  getHeaders() {
    return _normalizeHeaders(this._req.headers);
  }

  get remoteAddress() {
    return this._req.socket.remoteAddress;
  }

  get isSecure() {
    return (this._req.connection as any).encrypted;
  }

  readRawBody() {
    if (!this._rawBody) {
      this._rawBody = _readBody(this._req);
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
      this._bodyStream = _readBodyStream(this._req);
    }
    return this._bodyStream;
  }

  // -- response --

  get handled() {
    return this._res.writableEnded || this._res.headersSent;
  }

  get responseCode() {
    return this._res.statusCode || 200;
  }

  set responseCode(code: number) {
    this._res.statusCode = code;
  }

  get responseMessage() {
    return this._res.statusMessage;
  }

  set responseMessage(message: string) {
    this._res.statusMessage = message;
  }

  setResponseHeader(key: string, value: string) {
    this._res.setHeader(key, value);
  }

  appendResponseHeader(key: string, value: string) {
    this._res.appendHeader(key, value);
  }

  getResponseHeader(key: string) {
    const value = this._res.getHeader(key);
    if (!value) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return value as string;
  }

  getResponseHeaders() {
    return _normalizeHeaders(this._res.getHeaders());
  }

  getResponseSetCookie() {
    const value = this._res.getHeader("set-cookie");
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value as string];
  }

  removeResponseHeader(key: string) {
    this._res.removeHeader(key);
  }

  writeHead(code: number, message?: string) {
    this._res.writeHead(code, message);
  }

  writeEarlyHints(hints: Record<string, string | string[]>) {
    if (this._res.writeEarlyHints) {
      return new Promise<void>((resolve) => {
        return this._res.writeEarlyHints(hints, resolve);
      });
    }
  }

  sendResponse(data: RawResponse) {
    return _sendResponse(this._res, data);
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

function _sendResponse(
  res: NodeServerResponse,
  data: RawResponse,
): Promise<void> {
  // Native Web Streams
  // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
  if (typeof (data as ReadableStream)?.pipeTo === "function") {
    return (data as ReadableStream)
      .pipeTo(
        new WritableStream({
          write: (chunk) => {
            res.write(chunk);
          },
        }),
      )
      .then(() => _endResponse(res));
  }

  // Node.js Readable Streams
  // https://nodejs.org/api/stream.html#readable-streams
  if (typeof (data as NodeReadableStream)?.pipe === "function") {
    return new Promise<void>((resolve, reject) => {
      // Pipe stream to response
      (data as NodeReadableStream).pipe(res);

      // Handle stream events (if supported)
      if ((data as NodeReadableStream).on) {
        (data as NodeReadableStream).on("end", resolve);
        (data as NodeReadableStream).on("error", reject);
      }

      // Handle request aborts
      res.once("close", () => {
        (data as NodeReadableStream).destroy?.();
        // https://react.dev/reference/react-dom/server/renderToPipeableStream
        (data as any).abort?.();
      });
    }).then(() => _endResponse(res));
  }

  // Send as string or buffer
  return _endResponse(res, data);
}

function _endResponse(res: NodeServerResponse, chunk?: any): Promise<void> {
  return new Promise((resolve) => {
    res.end(chunk, resolve);
  });
}
