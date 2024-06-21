import { RawEvent, type RawResponse } from "../../types/_event";
import { HTTPMethod } from "../../types";

export class WebEvent implements RawEvent {
  static isWeb = true;

  _req: Request;

  _handled?: boolean;

  _path?: string;
  _originalPath?: string | undefined;
  _headers?: Record<string, string>;

  _responseBody?: RawResponse;
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
    return this._req.headers.get(key);
  }

  getHeaders() {
    if (!this._headers) {
      this._headers = Object.fromEntries(this._req.headers.entries());
    }
    return this._headers;
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

  readBodyStream() {
    return this._req.body || undefined;
  }

  // -- response --

  get handled() {
    return this._handled;
  }

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
    return this._responseHeaders.get(key);
  }

  getResponseHeaders() {
    return Object.fromEntries(this._responseHeaders.entries());
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
    this._handled = true;
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

  sendResponse(data: RawResponse) {
    this._handled = true;
    this._responseBody = data;
  }
}
