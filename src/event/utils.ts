import type { EventHandler, EventHandlerFunction, LazyEventHandlerFactory } from "../types";
import { H3TypeError, h3Warn } from "../../src/error";

export function eventHandler<T = unknown> (handler: EventHandlerFunction<T>): EventHandler<T> {
  // eslint-disable-next-line camelcase
  const __is_handler__: true = true;
  return Object.assign(handler, {
    default: handler,
    // eslint-disable-next-line camelcase
    __is_handler__
  });
}

export function isEventHandler (input: unknown): input is EventHandler {
  return typeof input === "function" && "__is_handler__" in input;
}

// This function is useless
export function toEventHandler (input: unknown, _?: unknown, _route?: string): EventHandler {
  if (isEventHandler(input)) {
    return input;
  }
  // TODO add small documentation here
  h3Warn(
    "Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.\n" +
    "Example: eventHandler(e => {}) or fromNodeMiddleware(e => {})"
  );

  // TODO do some runtime type checking
  return input as any;
}

export interface DynamicEventHandler extends EventHandler {
  set: (handler: EventHandler) => void
}

export function dynamicEventHandler (initial?: EventHandler): DynamicEventHandler {
  let current: EventHandler | undefined = initial;
  const wrapper = eventHandler((event) => {
    if (current) {
      return current(event);
    }
  }) as DynamicEventHandler;
  wrapper.set = (handler) => { current = handler; };
  return wrapper;
}

export function defineLazyEventHandler (factory: LazyEventHandlerFactory): EventHandler {
  let _promise: Promise<EventHandler>;
  let _resolved: EventHandler;
  const resolveHandler = () => {
    if (_resolved) { return Promise.resolve(_resolved); }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler = r.default || r;
        if (typeof handler !== "function") {
          throw new H3TypeError("Invalid lazy handler result. It should be a function:", handler);
        }
        _resolved = toEventHandler(eventHandler(handler));
        return _resolved;
      });
    }
    return _promise;
  };

  return eventHandler((event) => {
    if (_resolved) {
      return _resolved(event);
    }
    return resolveHandler().then(handler => handler(event));
  });
}

export { defineLazyEventHandler as lazyEventHandler };
