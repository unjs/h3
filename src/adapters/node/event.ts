import type { H3Event, H3EventContext, HTTPMethod } from "../../types";
import type { IncomingMessage, ServerResponse } from "node:http";
import { kNodeInspect } from "./internal/utils";
import { NodeRequestProxy } from "./internal/request";
import { NodeReqURLProxy } from "./internal/url";
import { NodeResponseProxy } from "./internal/response";
import { kEventIP } from "../../types/event";

export const NodeEvent = /* @__PURE__ */ (() =>
  class NodeEvent implements H3Event {
    static __is_event__ = true;
    context: H3EventContext;

    request: Request;
    url: URL;

    response: H3Event["response"];

    node: { req: IncomingMessage; res: ServerResponse };

    constructor(req: IncomingMessage, res: ServerResponse) {
      this.node = { req, res };

      this.context = Object.create(null);
      const url = (this.url = new NodeReqURLProxy(req));
      this.request = new NodeRequestProxy(req, url);
      this.response = new NodeResponseProxy(res);
    }

    get path(): string {
      return this.node.req.url || "/";
    }

    get method(): HTTPMethod {
      return this.node.req.method as HTTPMethod;
    }

    get [kEventIP](): string | undefined {
      return this.node.req.socket?.remoteAddress;
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
  })();
