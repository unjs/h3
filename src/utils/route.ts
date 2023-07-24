import { withoutTrailingSlash, withoutBase } from "ufo";
import { EventHandler } from "../types";
import { eventHandler } from "../event";

export function useBase(base: string, handler: EventHandler): EventHandler {
  base = withoutTrailingSlash(base);
  if (!base) {
    return handler;
  }
  return eventHandler(async (event) => {
    const _path = event._path;
    event._path = withoutBase(event.path || "/", base);
    try {
      return await handler(event);
    } finally {
      event._path = _path;
    }
  });
}
