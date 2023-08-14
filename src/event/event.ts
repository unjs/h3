import type { IncomingHttpHeaders } from "node:http";
import type { H3EventContext, HTTPMethod, EventHandlerRequest } from "../types";
import type { NodeIncomingMessage, NodeServerResponse } from "../adapters/node";
import { sendWebResponse } from "../utils";

// TODO: Dedup from body.ts
const PayloadMethods: Set<HTTPMethod> = new Set([
  "PATCH",
  "POST",
  "PUT",
  "DELETE",
]);

export interface NodeEventContext {
  req: NodeIncomingMessage & { originalUrl?: string };
  res: NodeServerResponse;
}

export interface WebEventContext {
  request?: Request;
  url?: URL;
}

export class H3Event<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _RequestT extends EventHandlerRequest = EventHandlerRequest,
> implements Pick<FetchEvent, "respondWith">
{
  "__is_event__" = true;

  // Context
  node: NodeEventContext; // Node
  web?: WebEventContext; // Web
  context: H3EventContext = {}; // Shared

  // Request
  _method: HTTPMethod | undefined;
  _path: string | undefined;
  _headers: Headers | undefined;
  _body: null | BodyInit | undefined;

  // Response
  _handled = false;

  constructor(req: NodeIncomingMessage, res: NodeServerResponse) {
    this.node = { req, res };
  }

  // --- Request ---

  get method(): HTTPMethod {
    if (!this._method) {
      this._method = (
        this.node.req.method || "GET"
      ).toUpperCase() as HTTPMethod;
    }
    return this._method;
  }

  get path() {
    return this._path || this.node.req.url || "/";
  }

  get headers(): Headers {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }

  // --- Respoonse ---

  get handled(): boolean {
    return (
      this._handled || this.node.res.writableEnded || this.node.res.headersSent
    );
  }

  respondWith(response: Response | PromiseLike<Response>): Promise<void> {
    return Promise.resolve(response).then((_response) =>
      sendWebResponse(this, _response),
    );
  }

  // --- Utils ---

  toString() {
    return `[${this.method}] ${this.path}`;
  }

  toJSON() {
    return this.toString();
  }

  // --- Deprecated ---

  /** @deprecated Please use `event.node.req` instead. **/
  get req() {
    return this.node.req;
  }

  /** @deprecated Please use `event.node.res` instead. **/
  get res() {
    return this.node.res;
  }
}

export function isEvent(input: any): input is H3Event {
  return "__is_event__" in input;
}

export function createEvent(
  req: NodeIncomingMessage,
  res: NodeServerResponse,
): H3Event {
  return new H3Event(req, res);
}

// --- Internal ---

function _normalizeNodeHeaders(nodeHeaders: IncomingHttpHeaders): Headers {
  const headers = new Headers();

  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }

  return headers;
}
