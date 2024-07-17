import type { H3, EventHandler, H3EventContext } from "../../types";

export function toWebHandler(
  app: H3,
): (request: Request, context?: H3EventContext) => Promise<Response> {
  return (request, context) => {
    return Promise.resolve(app.fetch(request, { h3: context }));
  };
}

export function fromWebHandler(
  handler: (request: Request, context?: H3EventContext) => Promise<Response>,
): EventHandler {
  return (event) => handler(event.request, event.context);
}
