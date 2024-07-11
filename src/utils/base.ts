import { _kRaw } from "../event";
import { H3, EventHandler } from "../types";
import { withoutBase, withoutTrailingSlash } from "./internal/path";

/**
 * Returns a new event handler that removes the base url of the event before calling the original handler.
 *
 * @example
 * const api = createApp()
 *  .get("/", () => "Hello API!");
 * const app = createApp();
 *  .use("/api/**", withBase("/api", api.handler));
 *
 * @param base The base path to prefix.
 * @param handler The event handler to use with the adapted path.
 */
export function withBase(base: string, input: EventHandler | H3): EventHandler {
  base = withoutTrailingSlash(base);

  const _originalHandler = (input as H3)?.handler || (input as EventHandler);

  const _handler: EventHandler = async (event) => {
    const _pathBefore = event[_kRaw].path || "/";
    event[_kRaw].path = withoutBase(event.path || "/", base);
    return Promise.resolve(_originalHandler(event)).finally(() => {
      event[_kRaw].path = _pathBefore;
    });
  };

  _handler.websocket = _originalHandler.websocket;
  _handler.resolve = _originalHandler.resolve
    ? (method, path) => {
        return _originalHandler.resolve!(method, withoutBase(path, base));
      }
    : undefined;

  return _handler;
}
