import type { HTTPMethod } from "../../types";
import type { RawEvent } from "../../types/event";
import { splitCookiesString } from "../../utils/cookie";
import { NodeHeadersProxy } from "./_headers";
import {
  _normalizeHeaders,
  _readBody,
  _getBodyStream,
  _sendResponse,
} from "./_internal";

import type { NodeIncomingMessage, NodeServerResponse } from "../../types/node";

export class NodeEvent implements RawEvent {
  static isNode = true;

  _req: NodeIncomingMessage;
  _res: NodeServerResponse;

  _handled?: boolean;

  _originalPath?: string | undefined;

  _rawBody?: Promise<undefined | Uint8Array>;
  _textBody?: Promise<undefined | string>;
  _formDataBody?: Promise<undefined | FormData>;
  _bodyStream?: undefined | ReadableStream<Uint8Array>;

  _headers?: NodeHeadersProxy;
  _responseHeaders?: NodeHeadersProxy;

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
    if (!this._headers) {
      this._headers = new NodeHeadersProxy(() => this._req.headers);
    }
    return this._headers;
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
      body ? new TextDecoder().decode(body) : undefined,
    );
    return this._textBody;
  }

  async readFormDataBody() {
    if (!this._formDataBody) {
      this._formDataBody = Promise.resolve(this.readRawBody()).then((body) =>
        body
          ? new Response(body, {
              headers: this.getHeaders(),
            }).formData()
          : undefined,
      );
    }
    return this._formDataBody;
  }

  getBodyStream() {
    if (!this._bodyStream) {
      this._bodyStream = _getBodyStream(this._req);
    }
    return this._bodyStream;
  }

  // -- response --

  get handled() {
    return this._handled || this._res.writableEnded || this._res.headersSent;
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
    if (!this._responseHeaders) {
      this._responseHeaders = new NodeHeadersProxy(() =>
        this._res.getHeaders(),
      );
    }
    return this._responseHeaders;
  }

  getResponseSetCookie() {
    const value = this._res.getHeader("set-cookie");
    if (!value) {
      return [];
    }
    return splitCookiesString(value as string | string[]);
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
}
