import type { H3EventContext, H3Event, HTTPMethod } from "../../types";

const H3Context = /* @__PURE__ */ (() => {
  const C = function () {};
  C.prototype = Object.create(null);
  return C;
})() as unknown as { new (): H3EventContext };

export abstract class BaseEvent implements Partial<H3Event> {
  static __is_event__ = true;

  abstract url: URL;
  abstract request: Request;

  context: H3EventContext;

  constructor(context?: H3EventContext) {
    this.context = context || new H3Context();
  }

  get method(): HTTPMethod {
    return this.request.method as HTTPMethod;
  }

  get path(): string {
    return this.url.pathname + this.url.search;
  }

  get headers(): Headers {
    return this.request.headers;
  }

  toString(): string {
    return `[${this.request.method}] ${this.request.url}`;
  }

  toJSON(): string {
    return this.toString();
  }
}
