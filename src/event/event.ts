import type { IncomingHttpHeaders } from "node:http";
import type { H3EventContext, HTTPMethod, EventHandlerRequest } from "../types";
import type { NodeIncomingMessage, NodeServerResponse } from "../adapters/node";
import { getRequestURL, sendWebResponse } from "../utils";

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

export class H3Event<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _RequestT extends EventHandlerRequest = EventHandlerRequest
> implements Pick<FetchEvent, "respondWith">
{
  "__is_event__" = true;

  // Context
  node: NodeEventContext;
  context: H3EventContext = {};

  // Request
  _request: Request | undefined;
  _method: HTTPMethod | undefined;
  _headers: Headers | undefined;
  _path: string | undefined;
  _url: URL | undefined;
  _body: BodyInit | undefined;

  // Response
  _handled = false;

  constructor(req: NodeIncomingMessage, res: NodeServerResponse) {
    this.node = { req, res };
  }

  get _originalPath() {
    return this.node.req.originalUrl || this.node.req.url || "/";
  }

  get _hasBody() {
    return PayloadMethods.has(this.method!);
  }

  get path() {
    return this._path || this.node.req.url || "/";
  }

  get url() {
    if (!this._url) {
      this._url = getRequestURL(this);
    }
    return this._url;
  }

  get handled(): boolean {
    return (
      this._handled || this.node.res.writableEnded || this.node.res.headersSent
    );
  }

  get method(): HTTPMethod {
    if (!this._method) {
      this._method = (
        this.node.req.method || "GET"
      ).toUpperCase() as HTTPMethod;
    }
    return this._method;
  }

  get headers(): Headers {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }

  /** @deprecated Please use `event.node.req` instead. **/
  get req() {
    return this.node.req;
  }

  /** @deprecated Please use `event.node.res` instead. **/
  get res() {
    return this.node.res;
  }

  get body() {
    if (!this._hasBody) {
      return undefined;
    }
    if (this._body === undefined) {
      this._body = new ReadableStream({
        start: (controller) => {
          this.node.req.on("data", (chunk) => {
            controller.enqueue(chunk);
          });
          this.node.req.on("end", () => {
            controller.close();
          });
          this.node.req.on("error", (err) => {
            controller.error(err);
          });
        },
      });
    }
    return this._body;
  }

  /** @experimental */
  get request(): Request {
    if (!this._request) {
      this._request = new Request(this.url, {
        // @ts-ignore Undici option
        duplex: "half",
        method: this.method,
        headers: this.headers,
        body: this.body,
      });
    }
    return this._request;
  }

  respondWith(response: Response | PromiseLike<Response>): Promise<void> {
    return Promise.resolve(response).then((_response) =>
      sendWebResponse(this, _response)
    );
  }
}

export function isEvent(input: any): input is H3Event {
  return "__is_event__" in input;
}

export function createEvent(
  req: NodeIncomingMessage,
  res: NodeServerResponse
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
