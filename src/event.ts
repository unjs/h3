import type { ServerRequest } from "srvx/types";
import type { H3Event, H3EventContext } from "./types";

import { EmptyObject } from "./utils/internal/obj";
import { FastURL } from "./url";

export class _H3Event implements H3Event {
  static __is_event__ = true;

  req: ServerRequest;
  url: URL;
  context: H3EventContext;
  _res?: H3EventResponse;

  constructor(req: ServerRequest, context?: H3EventContext) {
    this.context = context || new EmptyObject();
    this.req = req;
    this.url = new FastURL(req.url);
  }

  get res() {
    if (!this._res) {
      this._res = new H3EventResponse();
    }
    return this._res;
  }

  get path() {
    return this.url.pathname + this.url.search;
  }

  get method() {
    return this.req.method;
  }

  get node() {
    return this.req.node;
  }

  toString(): string {
    return `[${this.req.method}] ${this.req.url}`;
  }

  toJSON(): string {
    return this.toString();
  }
}

class H3EventResponse {
  status?: number;
  // statusText?: string;
  _headers?: Headers;
  get headers() {
    if (!this._headers) {
      this._headers = new Headers();
    }
    return this._headers;
  }
}
