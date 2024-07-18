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
  readonly url: URL;
  readonly headers: Headers;
  readonly request: Request;
  readonly ip?: string | undefined;

  // Response
  response: { headers: Headers; status?: number; statusText?: string };
}
