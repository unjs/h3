import type { H3Event, RawEvent } from "./types/event";

export const _kRaw: unique symbol = Symbol.for("h3.internal.raw");

export class EventWrapper implements H3Event {
  static "__is_event__" = true;

  context = Object.create(null);

  [_kRaw]: RawEvent;

  _onBeforeResponseCalled: boolean | undefined;
  _onAfterResponseCalled: boolean | undefined;

  constructor(raw: RawEvent) {
    this[_kRaw] = raw;
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
