import type { IncomingMessage, ServerResponse } from "node:http";
import type { EventHandlerRequest, H3EventContext, HTTPMethod } from ".";

export interface H3Event<
  _RequestT extends EventHandlerRequest = EventHandlerRequest,
> {
  // Context
  readonly context: H3EventContext;

  // Platform specific
  node?: {
    req: IncomingMessage;
    res: ServerResponse;
  };

  // Request
  readonly method: HTTPMethod;
  readonly path: string;
  readonly pathname: string;
  readonly queryString: string;
  readonly url: URL;
  readonly headers: Headers;
  readonly request: Request;
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
