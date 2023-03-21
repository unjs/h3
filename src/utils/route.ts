import { withoutTrailingSlash, withoutBase } from "ufo";
import { EventHandler } from "../types";
import { eventHandler } from "../event";

export function useBase(base: string, handler: EventHandler): EventHandler {
  base = withoutTrailingSlash(base);
  if (!base) {
    return handler;
  }
  return eventHandler((event) => {
    (event.node.req as any).originalUrl =
      (event.node.req as any).originalUrl || event.node.req.url || "/";
    event.node.req.url = withoutBase(event.node.req.url || "/", base);
    return handler(event);
  });
}
