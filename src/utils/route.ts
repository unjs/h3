import { withoutTrailingSlash, withoutBase } from "ufo";
import { EventHandler } from "../types";
import { eventHandler } from "../event";
import { getUrlPath } from "./url";

export function useBase(base: string, handler: EventHandler): EventHandler {
  base = withoutTrailingSlash(base);
  if (!base) {
    return handler;
  }
  return eventHandler((event) => {
    if (event.request) {
      event._internalData.originalUrl =
        event._internalData.originalUrl || getUrlPath(event) || "/";
      event._internalData.currentUrl = withoutBase(
        event._internalData.originalUrl,
        base
      );
      return handler(event);
    }
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    (event.node.req as any).originalUrl =
      (event.node.req as any).originalUrl || event.node.req.url || "/";
    event.node.req.url = withoutBase(event.node.req.url || "/", base);
    return handler(event);
  });
}
