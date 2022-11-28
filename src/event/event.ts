import type { H3EventContext, ParsedBodySymbol, RawBodySymbol } from "../types";
import type { NodeIncomingMessage, NodeServerResponse } from "../node";
import { MIMES } from "../utils";
import { H3Response } from "./response";

export interface NodeEventContext<Body = Object | Array<unknown> | String | Number | Boolean | null> {
  req: NodeIncomingMessage & {
    [RawBodySymbol]?: Buffer | Promise<Buffer>;
    [ParsedBodySymbol]?: Body;
  };
  res: NodeServerResponse;
}

export class H3Event implements Pick<FetchEvent, "respondWith"> {
  "__is_event__" = true;
  node: NodeEventContext;
  context: H3EventContext = {};

  constructor (req: NodeIncomingMessage, res: NodeServerResponse) {
    this.node = { req, res };
  }

  get path () {
    return this.node.req.url;
  }

  /** @deprecated Please use `event.node.req` instead. **/
  get req () {
    return this.node.req;
  }

  /** @deprecated Please use `event.node.res` instead. **/
  get res () {
    return this.node.res;
  }

  // Implementation of FetchEvent
  respondWith (r: H3Response | PromiseLike<H3Response>) {
    // Returning the promise is useful in many ways, even if the developer doesn't use it
    return Promise.resolve(r).then((_response) => {
      if (this.node.res.writableEnded) { return; }

      const response = _response instanceof H3Response ? _response : new H3Response(_response);

      for (const [key, value] of response.headers.entries()) {
        this.node.res.setHeader(key, value);
      }
      if (response.status) {
        this.node.res.statusCode = response.status;
      }
      if (response.statusText) {
        this.node.res.statusMessage = response.statusText;
      }
      if (response.redirected) {
        this.node.res.setHeader("location", response.url);
      }
      if (!response._body) {
        return this.node.res.end();
      }
      if (typeof response._body === "string" || "buffer" in response._body || "byteLength" in response._body) {
        return this.node.res.end(response._body);
      }
      if (!response.headers.has("content-type")) {
        response.headers.set("content-type", MIMES.json);
      }
      this.node.res.end(JSON.stringify(response._body));
    });
  }
}

/**
 * Check if an object is an H3Event by checking if it has the `__is_event__` property.
 */
export function isEvent (input: unknown): input is H3Event {
  return input instanceof Object && "__is_event__" in input;
}

/**
 * Create an H3Event from Node request and response objects.
 */
export function createEvent (req: NodeIncomingMessage, res: NodeServerResponse): H3Event {
  return new H3Event(req, res);
}
