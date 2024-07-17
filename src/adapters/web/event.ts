import type { H3Event, H3EventContext, HTTPMethod } from "../../types";

export class WebEvent implements H3Event {
  static __is_event__ = true;
  context: H3EventContext;

  request: Request;
  url: URL;

  response: H3Event["response"];

  constructor(request: Request, context?: H3EventContext) {
    this.context = context || Object.create(null);

    this.request = request;
    this.url = new URL(request.url);

    this.response = {
      headers: new Headers(),
    };
  }

  get path(): string {
    return this.url.pathname + this.url.search;
  }

  get method() {
    return this.request.method as HTTPMethod;
  }

  toString(): string {
    return `[h3 web event] ${this.request.method} ${this.request.url}`;
  }

  toJSON(): string {
    return this.toString();
  }
}
