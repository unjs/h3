import { withoutTrailingSlash, withoutBase } from "ufo";
import { EventHandler } from "../types";
import { eventHandler } from "../event";

export function useBase (base: string, handler: EventHandler): EventHandler {
  base = withoutTrailingSlash(base);
  if (!base) { return handler; }
  return eventHandler((event) => {
    event.node.req.url = withoutBase(event.node.req.url || "/", base);
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    return handler(event);
  });
}
