import type { IncomingHttpHeaders } from "node:http";
import type { H3EventContext, HTTPMethod } from "../types";
import type { NodeIncomingMessage, NodeServerResponse } from "../node";
import {
  MIMES,
  getRequestURL,
  sanitizeStatusCode,
  sanitizeStatusMessage,
} from "../utils";
import { H3Response } from "./response";

const DOUBLE_SLASH_RE = /[/\\]{2,}/g; // TODO: Dedup from request.ts
const RawBodySymbol = Symbol.for("h3RawBody"); // TODO: Dedup from body.ts

export interface NodeEventContext {
  req: NodeIncomingMessage;
  res: NodeServerResponse;
}

export class H3Event implements Pick<FetchEvent, "respondWith"> {
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
    return (
      (this.node.req as { originalUrl?: string }).originalUrl ||
      this.node.req.url ||
      "/"
    );
  }

  get path() {
    if (!this._path) {
      this._path = this._originalPath.replace(DOUBLE_SLASH_RE, "/");
    }
    return this._path;
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

  get method(): HTTPMethod | undefined {
    return this._method || (this.node.req.method as HTTPMethod);
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
    if (!this._body) {
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

  // Implementation of FetchEvent
  respondWith(r: H3Response | PromiseLike<H3Response>): void {
    Promise.resolve(r).then((_response) => {
      if (this.handled) {
        return;
      }

      const response =
        _response instanceof H3Response ? _response : new H3Response(_response);

      for (const [key, value] of response.headers.entries()) {
        this.node.res.setHeader(key, value);
      }
      if (response.status) {
        this.node.res.statusCode = sanitizeStatusCode(
          response.status,
          this.node.res.statusCode
        );
      }
      if (response.statusText) {
        this.node.res.statusMessage = sanitizeStatusMessage(
          response.statusText
        );
      }
      if (response.redirected) {
        this.node.res.setHeader("location", response.url);
      }
      if (!response._body) {
        return this.node.res.end();
      }
      if (
        typeof response._body === "string" ||
        "buffer" in response._body ||
        "byteLength" in response._body
      ) {
        return this.node.res.end(response._body);
      }
      if (!response.headers.has("content-type")) {
        response.headers.set("content-type", MIMES.json);
      }
      this.node.res.end(JSON.stringify(response._body));
    });
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
