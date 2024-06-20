import type { Readable as NodeReadable } from "node:stream";
import { RawEvent } from "../../types/_event";
import { HTTPMethod } from "../../types";

export class WebEvent implements RawEvent {
  request: Request;

  _path?: string;
  _headers?: Record<string, string>;

  _responseBody?: BodyInit;
  _responseCode?: number;
  _responseMessage?: string;
  _responseHeaders: Headers = new Headers();

  constructor(request: Request) {
    this.request = request;
  }

  // -- request --

  get method() {
    return this.request.method as HTTPMethod;
  }

  get path() {
    if (!this._path) {
      this._path = new URL(this.request.url).pathname;
    }
    return this._path;
  }

  set path(path: string) {
    this._path = path;
  }

  getHeader(key: string) {
    return this.request.headers.get(key);
  }

  getHeaders() {
    if (!this._headers) {
      this._headers = Object.fromEntries(this.request.headers.entries());
    }
    return this._headers;
  }

  get remoteAddress() {
    return undefined;
  }

  get isSecure() {
    return undefined;
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
    if (code) {
      this.responseCode = code;
    }
    if (message) {
      this.responseMessage = message;
    }
  }

  sendResponse(body?: unknown) {
    this._responseBody = body as BodyInit;
  }

  sendStream(stream: NodeReadable | ReadableStream) {
    this._responseBody = stream as BodyInit;
  }

  writeEarlyHints(_hints: Record<string, string | string[]>) {
    // noop
  }
}
