import type { ServerRequest } from "srvx/types";
import type { H3Event, H3EventContext, HTTPMethod } from "./types";
import type { H3EventResponse } from "./types/event";

const H3EventContext = /* @__PURE__ */ (() => {
  const C = function () {};
  C.prototype = Object.create(null);
  return C;
})() as unknown as { new (): H3EventContext };

const HeadersObject = /* @__PURE__ */ (() => {
  const C = function () {};
  C.prototype = Object.create(null);
  return C;
})() as unknown as { new (): H3EventContext };

export class H3WebEvent implements H3Event {
  static __is_event__ = true;
  context: H3EventContext;
  request: ServerRequest;
  response: H3EventResponse;

  _url?: URL;
  _pathname?: string;
  _urlqindex?: number;
  _query?: URLSearchParams;
  _queryString?: string;

  constructor(request: ServerRequest, context?: H3EventContext) {
    this.context = context || new H3EventContext();
    this.request = request;
    this.response = new WebEventResponse();
  }

  get method(): HTTPMethod {
    return this.request.method as HTTPMethod;
  }

  get headers(): Headers {
    return this.request.headers;
  }

  get url() {
    if (!this._url) {
      this._url = new URL(this.request.url);
    }
    return this._url;
  }

  get path() {
    return this.pathname + this.queryString;
  }

  get pathname() {
    if (this._url) {
      return this._url.pathname; // reuse parsed URL
    }
    if (!this._pathname) {
      const url = this.request.url;
      const protoIndex = url.indexOf("://");
      if (protoIndex === -1) {
        return this.url.pathname; // deoptimize
      }
      const pIndex = url.indexOf("/", protoIndex + 4 /* :// */);
      if (pIndex === -1) {
        return this.url.pathname; // deoptimize
      }
      const qIndex = (this._urlqindex = url.indexOf("?", pIndex));
      this._pathname = url.slice(pIndex, qIndex === -1 ? undefined : qIndex);
    }
    return this._pathname;
  }

  get query() {
    if (this._url) {
      return this._url.searchParams; // reuse parsed URL
    }
    if (!this._query) {
      this._query = new URLSearchParams(this.queryString);
    }
    return this._query;
  }

  get queryString() {
    if (this._url) {
      return this._url.search; // reuse parsed URL
    }
    if (!this._queryString) {
      const qIndex = this._urlqindex;
      if (qIndex === -1) {
        this._queryString = "";
      } else {
        this._queryString =
          this._urlqindex === undefined
            ? this.url.search // deoptimize (mostly unlikely as pathname accessor is always used)
            : this.request.url.slice(this._urlqindex);
      }
    }
    return this._queryString;
  }

  get node() {
    return this.request.node;
  }

  get ip() {
    return this.request.remoteAddress;
  }

  toString(): string {
    return `[${this.request.method}] ${this.request.url}`;
  }

  toJSON(): string {
    return this.toString();
  }
}

class WebEventResponse implements H3EventResponse {
  _headersInit?: Record<string, string>;
  _headers?: Headers;

  get headers() {
    if (!this._headers) {
      this._headers = new Headers(this._headersInit);
    }
    return this._headers;
  }

  setHeader(name: string, value: string): void {
    if (this._headers) {
      this._headers.set(name, value);
    } else {
      if (!this._headersInit) {
        this._headersInit = new HeadersObject();
      }
      this._headersInit[name] = value;
    }
  }
}
