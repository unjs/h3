import type { EventHandlerRequest, H3EventContext, HTTPMethod } from ".";
import type { ServerRequest } from "srvx/types";

export interface H3Event<
  _RequestT extends EventHandlerRequest = EventHandlerRequest,
> {
  // Context
  readonly context: H3EventContext;

  // Platform specific
  node?: ServerRequest["node"];

  // Request
  readonly request: ServerRequest;
  readonly method: HTTPMethod;
  readonly path: string;
  readonly pathname: string;
  readonly query: URLSearchParams;
  readonly queryString: string;
  readonly url: URL;
  readonly headers: Headers;
  readonly ip?: string | undefined;

  // Response
  response: H3EventResponse;
}

export interface H3EventResponse {
  status?: number;
  statusText?: string;

  _headersInit?: HeadersInit;
  _headers?: Headers;

  readonly headers: Headers;

  setHeader(name: string, value: string): void;
}
