import type { H3Event, H3EventContext, HTTPMethod } from "../../types";
import type { IncomingMessage, ServerResponse } from "node:http";
import { BaseEvent } from "../base/event";
import { kNodeInspect } from "./internal/utils";
import { NodeRequestProxy } from "./internal/request";
import { NodeResponseProxy } from "./internal/response";

export const NodeEvent = /* @__PURE__ */ (() =>
  class NodeEvent extends BaseEvent implements H3Event {
    request: Request;
    url: URL;
    response: H3Event["response"];

    node: { req: IncomingMessage; res: ServerResponse };

    constructor(
      req: IncomingMessage,
      res: ServerResponse,
      context?: H3EventContext,
    ) {
      super(context);
      this.node = { req, res };
      const request = new NodeRequestProxy(req);
      this.request = request;
      this.url = request._url;
      this.response = new NodeResponseProxy(res);
    }

    get path(): string {
      return this.node.req.url || "/";
    }

    get pathname(): string {
      return this.url.pathname;
    }

    get query(): URLSearchParams {
      return this.url.searchParams;
    }

    get queryString(): string {
      return this.url.search;
    }

    get method(): HTTPMethod {
      return this.node.req.method as HTTPMethod;
    }

    get ip(): string | undefined {
      return this.node.req.socket?.remoteAddress;
    }

    [kNodeInspect]() {
      return {
        context: this.context,
        request: this.request,
        response: this.response,
      };
    }
  })();
