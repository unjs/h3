import { splitCookiesString } from "../../utils";
import type { OutgoingHttpHeaders, IncomingHttpHeaders } from "node:http";

type NodeHeaders = OutgoingHttpHeaders | IncomingHttpHeaders;

export class NodeHeadersProxy implements Headers {
  getHeaders: () => NodeHeaders;

  constructor(getHeaders: () => NodeHeaders) {
    this.getHeaders = getHeaders;
  }

  append(name: string, value: string): void {
    const _headers = this.getHeaders();
    const _current = _headers[name];
    if (_current) {
      if (Array.isArray(_current)) {
        _current.push(value);
      } else {
        _headers[name] = [_current as string, value];
      }
    } else {
      _headers[name] = value;
    }
  }

  delete(name: string): void {
    this.getHeaders()[name] = undefined;
  }

  get(name: string): string | null {
    return _normalizeValue(this.getHeaders()[name]);
  }

  getSetCookie(): string[] {
    const setCookie = this.getHeaders()["set-cookie"];
    if (!setCookie || setCookie.length === 0) {
      return [];
    }
    return splitCookiesString(setCookie);
  }

  has(name: string): boolean {
    return !!this.getHeaders()[name];
  }

  set(name: string, value: string): void {
    this.getHeaders()[name] = value;
  }

  forEach(
    cb: (value: string, key: string, parent: Headers) => void,
    thisArg?: any,
  ): void {
    const _headers = this.getHeaders();
    for (const key in _headers) {
      if (_headers[key]) {
        cb.call(thisArg, _normalizeValue(_headers[key]), key, this);
      }
    }
  }

  *entries(): IterableIterator<[string, string]> {
    const _headers = this.getHeaders();
    for (const key in _headers) {
      yield [key, _normalizeValue(_headers[key])];
    }
  }

  *keys(): IterableIterator<string> {
    const keys = Object.keys(this.getHeaders());
    for (const key of keys) {
      yield key;
    }
  }

  *values(): IterableIterator<string> {
    const values = Object.values(this.getHeaders());
    for (const value of values) {
      yield _normalizeValue(value);
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries()[Symbol.iterator]();
  }
}

function _normalizeValue(
  value: string | string[] | number | undefined,
): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return (value as string) || "";
}
