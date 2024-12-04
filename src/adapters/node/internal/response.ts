import type { ServerResponse } from "node:http";
import { NodeResHeadersProxy } from "srvx/node-utils";
import type { H3EventResponse } from "../../../types/event";
import { kNodeInspect, kNodeRes } from "./utils";

export const H3NodeResponse = /* @__PURE__ */ (() =>
  class H3NodeResponse implements H3EventResponse {
    [kNodeRes]: ServerResponse;

    _headers: Headers;
    headers: Headers;

    constructor(res: ServerResponse) {
      this[kNodeRes] = res;
      this.headers = this._headers = new NodeResHeadersProxy(res);
    }

    get status() {
      return this[kNodeRes].statusCode;
    }

    set status(value) {
      this[kNodeRes].statusCode = value;
    }

    get statusText() {
      return this[kNodeRes].statusMessage;
    }

    set statusText(value) {
      this[kNodeRes].statusMessage = value;
    }

    get [Symbol.toStringTag]() {
      return "Response";
    }

    setHeader(name: string, value: string): void {
      this[kNodeRes].setHeader(name, value);
    }

    [kNodeInspect]() {
      return {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      };
    }
  })();
