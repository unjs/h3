import type { EventHandler } from "../types";
import { _kRaw } from "../event";
import { defineEventHandler } from "../handler";
import { withoutTrailingSlash, withoutBase } from "./internal/path";

/**
 * Prefixes and executes a handler with a base path.
 *
 * @example
 * const app = createApp();
 * const router = createRouter();
 *
 * const apiRouter = createRouter().get(
 *   "/hello",
 *   defineEventHandler((event) => {
 *     return "Hello API!";
 *   }),
 * );
 *
 * router.use("/api/**", useBase("/api", apiRouter.handler));
 *
 * app.use(router.handler);
 *
 * @param base The base path to prefix. When set to an empty string, the handler will be run as is.
 * @param handler The event handler to use with the adapted path.
 */
export function useBase(base: string, handler: EventHandler): EventHandler {
  base = withoutTrailingSlash(base);

  if (!base || base === "/") {
    return handler;
  }

  return defineEventHandler(async (event) => {
    const _pathBefore = event[_kRaw].path || "/";
    event[_kRaw].path = withoutBase(event.path || "/", base);
    try {
      return await handler(event);
    } finally {
      event[_kRaw].path = _pathBefore;
    }
  });
}
