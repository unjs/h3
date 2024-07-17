import type { EventHandlerRequest, H3EventContext, HTTPMethod } from ".";

export interface H3Event<
  _RequestT extends EventHandlerRequest = EventHandlerRequest,
> {
  // Context
  readonly context: H3EventContext;

  // Request
  readonly request: Request;
  readonly url: URL;

  readonly method: HTTPMethod;
  readonly path: string;

  // Response
  response: { headers: Headers; status?: number; statusText?: string };
}
