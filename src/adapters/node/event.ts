import type { H3Event, H3EventContext, HTTPMethod } from "../../types";
import type { IncomingMessage, ServerResponse } from "node:http";
import { kNodeInspect, kNodeReq, kNodeRes } from "./internal/utils";
import { NodeRequestProxy } from "./internal/request";
import { NodeReqURLProxy } from "./internal/url";
import { NodeResponseProxy } from "./internal/response";

export class NodeEvent implements H3Event {
  static __is_event__ = true;
  context: H3EventContext;

  request: Request;
  url: URL;

  response: H3Event["response"];

  [kNodeReq]: IncomingMessage;
  [kNodeRes]: ServerResponse;

  constructor(req: IncomingMessage, res: ServerResponse) {
    this[kNodeReq] = req;
    this[kNodeRes] = res;

    this.context = Object.create(null);
    const url = (this.url = new NodeReqURLProxy(req));
    this.request = new NodeRequestProxy(req, url);
    this.response = new NodeResponseProxy(res);
  }

  get path(): string {
    return this[kNodeReq].url || "/";
  }

  get method(): HTTPMethod {
    return this[kNodeReq].method as HTTPMethod;
  }

  get [Symbol.toStringTag]() {
    return "Response";
  }

  [kNodeInspect]() {
    return {
      context: this.context,
      request: this.request,
      response: this.response,
    };
  }
}
