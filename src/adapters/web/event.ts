import type { RawEvent } from "../../types/event";
import type { HTTPMethod } from "../../types";

export class WebEvent implements RawEvent {
  static isWeb = true;

  _req: Request;

  _path?: string;
  _originalPath?: string | undefined;

  _responseCode?: number;
  _responseMessage?: string;
  _responseHeaders: Headers = new Headers();

  _rawBody?: Promise<undefined | Uint8Array>;
  _textBody?: Promise<undefined | string>;
  _formDataBody?: Promise<undefined | FormData>;

  constructor(request: Request) {
    this._req = request;
  }

  getContext() {
    return {
      request: this._req,
    };
  }

  // -- request --

  get method() {
    return this._req.method as HTTPMethod;
  }

  get path() {
    if (!this._path) {
      this._path = this._originalPath = new URL(this._req.url).pathname;
    }
    return this._path;
  }

  set path(path: string) {
    if (!this._originalPath) {
      this._originalPath = this._path;
    }
    this._path = path;
  }

  get originalPath() {
    return this._originalPath || this.path;
  }

  getHeader(key: string) {
    return this._req.headers.get(key) ?? undefined;
  }

  getHeaders() {
    return this._req.headers;
  }

  get remoteAddress() {
    return undefined;
  }

  get isSecure() {
    return undefined;
  }

  async readRawBody() {
    if (!this._rawBody) {
      this._rawBody = this._req
        .arrayBuffer()
        .then((buffer) => new Uint8Array(buffer));
    }
    return this._rawBody;
  }

  readTextBody() {
    if (this._textBody) {
      return this._textBody;
    }
    if (this._rawBody) {
      this._textBody = Promise.resolve(this._rawBody).then((body) =>
        body ? new TextDecoder().decode(body) : undefined,
      );
      return this._textBody;
    }
    this._textBody = this._req.text();
    return this._textBody;
  }

  readFormDataBody() {
    if (this._formDataBody) {
      return this._formDataBody;
    }
    this._formDataBody = this._req.formData();
    return this._formDataBody;
  }

  getBodyStream() {
    return this._req.body || undefined;
  }

  // -- response --

  get responseCode() {
    return this._responseCode || 200;
  }

  set responseCode(code: number) {
    this._responseCode = code;
  }

  get responseMessage() {
    return this._responseMessage || "";
  }

  set responseMessage(message: string) {
    this._responseMessage = message;
  }

  setResponseHeader(key: string, value: string) {
    this._responseHeaders.set(key, value);
  }

  appendResponseHeader(key: string, value: string) {
    this._responseHeaders.append(key, value);
  }

  getResponseHeader(key: string) {
    return this._responseHeaders.get(key) ?? undefined;
  }

  getResponseHeaders() {
    return this._responseHeaders;
  }

  getResponseSetCookie() {
    if (this._responseHeaders.getSetCookie) {
      return this._responseHeaders.getSetCookie();
    }
    const setCookie = this._responseHeaders.get("set-cookie");
    return setCookie ? [setCookie] : [];
  }

  removeResponseHeader(key: string) {
    this._responseHeaders.delete(key);
  }

  writeHead(code: number, message?: string) {
    if (code) {
      this.responseCode = code;
    }
    if (message) {
      this.responseMessage = message;
    }
  }

  writeEarlyHints(_hints: Record<string, string | string[]>) {
    // noop
  }
}
