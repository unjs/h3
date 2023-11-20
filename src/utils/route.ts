import { withoutTrailingSlash, withoutBase } from "ufo";
import { EventHandler } from "../types";
import { eventHandler } from "../event";

/**
 * Prefixes and executes a handler with a base path.
 * @param base The base path to prefix. When set to an empty string, the handler will be run as is.
 * @param handler The event handler to use with the adapted path.
 */
export function useBase(base: string, handler: EventHandler): EventHandler {
  base = withoutTrailingSlash(base);

  if (!base || base === "/") {
    return handler;
  }

  return eventHandler(async (event) => {
    // Keep original incoming url accessible
    event.node.req.originalUrl =
      event.node.req.originalUrl || event.node.req.url || "/";

    const _path = event._path || event.node.req.url || "/";

    event._path = withoutBase(event.path || "/", base);
    event.node.req.url = event._path;

    try {
      return await handler(event);
    } finally {
      event._path = event.node.req.url = _path;
    }
  });
}
