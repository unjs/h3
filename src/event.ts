import { WebEvent } from "./adapters/web/event";
import type { H3EventContext, H3Event } from "./types";
import { RawEvent } from "./types/event";

export const _kRaw: unique symbol = Symbol.for("h3.rawEvent");

export class EventWrapper implements H3Event {
  static "__is_event__" = true;

  context = Object.create(null);

  [_kRaw]: RawEvent;

  constructor(raw: RawEvent, initialContext?: H3EventContext) {
    this[_kRaw] = raw;
    if (initialContext) {
      Object.assign(this.context, initialContext);
    }
  }

  get method() {
    return this[_kRaw].method || "GET";
  }

  get path() {
    return this[_kRaw].path;
  }

  get headers(): Headers {
    return this[_kRaw].getHeaders();
  }

  toString() {
    return `[${this.method}] ${this.path}`;
  }

  toJSON() {
    return this.toString();
  }
}

/**
 * Checks if the input is an H3Event object.
 * @param input - The input to check.
 * @returns True if the input is an H3Event object, false otherwise.
 * @see H3Event
 */
export function isEvent(input: any): input is H3Event {
  const ctor = input?.constructor;
  return (
    ctor.__is_event__ ||
    input.__is_event__ /* Backward compatibility with h3 v1 */
  );
}

export function mockEvent(
  _request: string | URL | Request,
  options?: RequestInit & { h3?: H3EventContext },
) {
  let request: Request;
  if (typeof _request === "string") {
    let url = _request;
    if (url[0] === "/") {
      url = `http://localhost${url}`;
    }
    request = new Request(url, options);
  } else if (options || _request instanceof URL) {
    request = new Request(_request, options);
  } else {
    request = _request;
  }
  const webEvent = new WebEvent(request);
  return new EventWrapper(webEvent, options?.h3);
}
