import type { H3EventContext, H3Event, HTTPMethod } from "../../types";

export abstract class BaseEvent implements Partial<H3Event> {
  static __is_event__ = true;

  abstract url: URL;
  abstract request: Request;

  context: H3EventContext;

  constructor(context?: H3EventContext) {
    this.context = context || Object.create(null);
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
