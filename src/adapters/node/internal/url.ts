import type { IncomingMessage } from "node:http";
import { kNodeInspect, kNodeReq } from "./utils";

export class NodeReqURLProxy implements URL {
  [kNodeReq]: IncomingMessage;

  _protocol?: string;
  _hostname?: string;
  _port?: string;

  _pathname?: string;
  _search?: string;
  _searchParams?: URLSearchParams;

  hash: string = "";
  password: string = "";
  username: string = "";

  constructor(req: IncomingMessage) {
    this[kNodeReq] = req;
  }

  // host
  get host() {
    return this[kNodeReq].headers.host || "";
  }
  set host(value: string) {
    this._hostname = undefined;
    this._port = undefined;
    this[kNodeReq].headers.host = value;
  }

  // hostname
  get hostname() {
    if (this._hostname === undefined) {
      const [hostname, port] = (this[kNodeReq].headers.host || "").split(":");
      if (this._port === undefined && port) {
        this._port = port;
      }
      this._hostname = hostname || "localhost";
    }
    return this._hostname;
  }
  set hostname(value: string) {
    this._hostname = value;
  }

  // port
  get port() {
    if (this._port === undefined) {
      const [hostname, port] = (this[kNodeReq].headers.host || "").split(":");
      if (this._hostname === undefined && hostname) {
        this._hostname = hostname;
      }
      this._port = port || String(this[kNodeReq].socket?.localPort) || "";
    }
    return this._port;
  }
  set port(value: string) {
    this._port = value;
  }

  // pathname
  get pathname() {
    if (this._pathname === undefined) {
      const [pathname, search] = _parsePath(this[kNodeReq].url || "/");
      this._pathname = pathname;
      if (this._search === undefined) {
        this._search = search;
      }
    }
    return this._pathname;
  }
  set pathname(value: string) {
    if (value[0] !== "/") {
      value = "/" + value;
    }
    if (value === this._pathname) {
      return;
    }
    this._pathname = value;
    this[kNodeReq].url = value + this.search;
  }

  // search
  get search() {
    if (this._search === undefined) {
      const [pathname, search] = _parsePath(this[kNodeReq].url || "/");
      this._search = search;
      if (this._pathname === undefined) {
        this._pathname = pathname;
      }
    }
    return this._search;
  }
  set search(value: string) {
    if (value === "?") {
      value = "";
    } else if (value && value[0] !== "?") {
      value = "?" + value;
    }
    if (value === this._search) {
      return;
    }
    this._search = value;
    this._searchParams = undefined;
    this[kNodeReq].url = this.pathname + value;
  }

  // searchParams
  get searchParams() {
    if (!this._searchParams) {
      this._searchParams = new URLSearchParams(this.search);
    }
    return this._searchParams;
  }
  set searchParams(value: URLSearchParams) {
    this._searchParams = value;
    this._search = value.toString();
  }

  // protocol
  get protocol() {
    if (!this._protocol) {
      this._protocol =
        (this[kNodeReq].socket as any)?.encrypted ||
        this[kNodeReq].headers["x-forwarded-proto"] === "https"
          ? "https:"
          : "http:";
    }
    return this._protocol;
  }
  set protocol(value) {
    this._protocol = value;
  }

  // origin
  get origin() {
    return `${this.protocol}//${this.host}`;
  }
  set origin(_value) {
    // ignore
  }

  // href
  get href() {
    return `${this.protocol}//${this.host}${this.pathname}${this.search}`;
  }
  set href(value: string) {
    const _url = new URL(value);
    this._protocol = _url.protocol;
    this.username = _url.username;
    this.password = _url.password;
    this._hostname = _url.hostname;
    this._port = _url.port;
    this.pathname = _url.pathname;
    this.search = _url.search;
    this.hash = _url.hash;
  }

  toString(): string {
    return this.href;
  }

  toJSON(): string {
    return this.href;
  }

  get [Symbol.toStringTag]() {
    return "URL";
  }

  [kNodeInspect]() {
    return this.href;
  }
}

function _parsePath(input: string) {
  let pIndex: number = -1;
  let qIndex: number = -1;

  const len = input.length;
  for (let i = 0; i < len; i++) {
    const c = input[i];
    if (pIndex === -1 && c !== "/" && c !== "\\") {
      pIndex = i;
    }
    if (qIndex === -1 && c === "?") {
      qIndex = i;
    }
  }

  const search = qIndex === -1 || qIndex >= len - 1 ? "" : input.slice(qIndex);
  const path =
    pIndex === -1
      ? "/"
      : "/" + input.slice(pIndex, qIndex === -1 ? undefined : qIndex);

  return [path, search];
}
