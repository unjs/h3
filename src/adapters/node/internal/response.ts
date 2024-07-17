import type { ServerResponse } from "node:http";
import type { H3Event } from "../../../types";
import { kNodeInspect, kNodeRes } from "./utils";
import { NodeResHeadersProxy } from "./headers";

type H3Response = H3Event["response"];

export class NodeResponseProxy implements H3Response {
  [kNodeRes]: ServerResponse;

  headers: NodeResHeadersProxy;

  constructor(res: ServerResponse) {
    this[kNodeRes] = res;
    this.headers = new NodeResHeadersProxy(res);
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

  [kNodeInspect]() {
    return {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    };
  }
}
