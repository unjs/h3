import type { IncomingMessage, ServerResponse } from "node:http";
import type { EventHandlerRequest, H3EventContext, HTTPMethod } from ".";

export const kEventIP: unique symbol = Symbol.for("h3.event.ip");

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

  // Internal
  [kEventIP]?: string | undefined;

  // Request
  readonly request: Request;
  readonly url: URL;

  readonly method: HTTPMethod;
  readonly path: string;

  // Response
  response: { headers: Headers; status?: number; statusText?: string };
}
