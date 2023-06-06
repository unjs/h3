import { withoutTrailingSlash, withoutBase } from "ufo";
import { EventHandler } from "../types";
import { eventHandler } from "../event";
import {
  getOriginalUrlPath,
  getUrlPath,
  setOriginalUrlPath,
  setUrlPath,
} from "./url";

export function useBase(base: string, handler: EventHandler): EventHandler {
  base = withoutTrailingSlash(base);
  if (!base) {
    return handler;
  }
  return eventHandler((event) => {
    setOriginalUrlPath(
      event,
      getOriginalUrlPath(event) || getUrlPath(event) || "/"
    );
    setUrlPath(event, withoutBase(getUrlPath(event) || "/", base));
    return handler(event);
  });
}
