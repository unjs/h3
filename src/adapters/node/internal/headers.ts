import type { IncomingMessage, ServerResponse } from "node:http";
import { splitCookiesString } from "../../../utils/cookie";
import { kNodeInspect, kNodeReq, kNodeRes } from "./utils";

export class NodeReqHeadersProxy implements Headers {
  [kNodeReq]: IncomingMessage;

  constructor(req: IncomingMessage) {
    this[kNodeReq] = req;
  }

  append(name: string, value: string): void {
    const _headers = this[kNodeReq].headers;
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
    this[kNodeReq].headers[name] = undefined;
  }

  get(name: string): string | null {
    return _normalizeValue(this[kNodeReq].headers[name]);
  }

  getSetCookie(): string[] {
    const setCookie = this[kNodeReq].headers["set-cookie"];
    if (!setCookie || setCookie.length === 0) {
      return [];
    }
    return splitCookiesString(setCookie);
  }

  has(name: string): boolean {
    return !!this[kNodeReq].headers[name];
  }

  set(name: string, value: string): void {
    this[kNodeReq].headers[name] = value;
  }

  forEach(
    cb: (value: string, key: string, parent: Headers) => void,
    thisArg?: any,
  ): void {
    const _headers = this[kNodeReq].headers;
    for (const key in _headers) {
      if (_headers[key]) {
        cb.call(thisArg, _normalizeValue(_headers[key]), key, this);
      }
    }
  }

  *entries(): IterableIterator<[string, string]> {
    const _headers = this[kNodeReq].headers;
    for (const key in _headers) {
      yield [key, _normalizeValue(_headers[key])];
    }
  }

  *keys(): IterableIterator<string> {
    const keys = Object.keys(this[kNodeReq].headers);
    for (const key of keys) {
      yield key;
    }
  }

  *values(): IterableIterator<string> {
    const values = Object.values(this[kNodeReq].headers);
    for (const value of values) {
      yield _normalizeValue(value);
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries()[Symbol.iterator]();
  }

  get [Symbol.toStringTag]() {
    return "Headers";
  }

  [kNodeInspect]() {
    return Object.fromEntries(this.entries());
  }
}

export class NodeResHeadersProxy implements Headers {
  [kNodeRes]: ServerResponse;

  constructor(res: ServerResponse) {
    this[kNodeRes] = res;
  }

  append(name: string, value: string): void {
    this[kNodeRes].appendHeader(name, value);
  }

  delete(name: string): void {
    this[kNodeRes].removeHeader(name);
  }

  get(name: string): string | null {
    return _normalizeValue(this[kNodeRes].getHeader(name));
  }

  getSetCookie(): string[] {
    const setCookie = _normalizeValue(this[kNodeRes].getHeader("set-cookie"));
    if (!setCookie) {
      return [];
    }
    return splitCookiesString(setCookie);
  }

  has(name: string): boolean {
    return this[kNodeRes].hasHeader(name);
  }

  set(name: string, value: string): void {
    this[kNodeRes].setHeader(name, value);
  }

  forEach(
    cb: (value: string, key: string, parent: Headers) => void,
    thisArg?: any,
  ): void {
    const _headers = this[kNodeRes].getHeaders();
    for (const key in _headers) {
      if (_headers[key]) {
        cb.call(thisArg, _normalizeValue(_headers[key]), key, this);
      }
    }
  }

  *entries(): IterableIterator<[string, string]> {
    const _headers = this[kNodeRes].getHeaders();
    for (const key in _headers) {
      yield [key, _normalizeValue(_headers[key])];
    }
  }

  *keys(): IterableIterator<string> {
    const keys = this[kNodeRes].getHeaderNames();
    for (const key of keys) {
      yield key;
    }
  }

  *values(): IterableIterator<string> {
    const values = Object.values(this[kNodeRes].getHeaders());
    for (const value of values) {
      yield _normalizeValue(value);
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries()[Symbol.iterator]();
  }

  get [Symbol.toStringTag]() {
    return "Headers";
  }

  [kNodeInspect]() {
    return Object.fromEntries(this.entries());
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
