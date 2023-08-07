import type {
  EventHandler,
  LazyEventHandler,
  EventHandlerRequest,
  EventHandlerResponse,
  EventHandlerObject,
} from "../types";
import type { H3Event } from "./event";

export function defineEventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response = EventHandlerResponse,
  ValidateFunction extends (
    event: H3Event<Request>,
  ) => H3Event<Request> | Promise<H3Event<Request>> = (
    event: H3Event<Request>,
  ) => H3Event<any> | Promise<H3Event<any>>,
  ValidatedRequest extends EventHandlerRequest = Awaited<
    ReturnType<ValidateFunction>
  > extends H3Event<infer R>
    ? R
    : Request,
>(
  handler:
    | EventHandler<Request, Response>
    | EventHandlerObject<Request, Response, ValidateFunction, ValidatedRequest>,
): EventHandler<ValidatedRequest, Response>;
// TODO: remove when appropriate
// This signature provides backwards compatibility with previous signature where first generic was return type
export function defineEventHandler<
  Request = EventHandlerRequest,
  Response = EventHandlerResponse,
>(
  handler: EventHandler<
    Request extends EventHandlerRequest ? Request : EventHandlerRequest,
    Request extends EventHandlerRequest ? Response : Request
  >,
): EventHandler<
  Request extends EventHandlerRequest ? Request : EventHandlerRequest,
  Request extends EventHandlerRequest ? Response : Request
>;
export function defineEventHandler<
  Request extends EventHandlerRequest,
  Response = EventHandlerResponse,
  ValidateFunction extends (
    event: H3Event<Request>,
  ) => H3Event<Request> | Promise<H3Event<Request>> = (
    event: H3Event<Request>,
  ) => H3Event<any> | Promise<H3Event<any>>,
  ValidatedRequest extends EventHandlerRequest = Awaited<
    ReturnType<ValidateFunction>
  > extends H3Event<infer R>
    ? R
    : Request,
>(
  handler:
    | EventHandler<Request, Response>
    | EventHandlerObject<Request, Response, ValidateFunction, ValidatedRequest>,
): EventHandler<ValidatedRequest, Response> {
  // Function Syntax
  if (typeof handler === "function") {
    return Object.assign(handler, { __is_handler__: true });
  }
  // Object Syntax
  const _handler: EventHandler<Request, any> = (event) => {
    return _callHandler(event, handler);
  };
  return Object.assign(_handler, { __is_handler__: true });
}

async function _callHandler(event: H3Event, handler: EventHandlerObject) {
  if (handler.validate) {
    await handler.validate(event);
  }
  if (handler.before) {
    for (const hook of handler.before) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler.handler(event);
  const response = { body };
  if (handler.after) {
    for (const hook of handler.after) {
      await hook(event, response);
    }
  }
  return response.body;
}

export const eventHandler = defineEventHandler;

export function isEventHandler(input: any): input is EventHandler {
  return "__is_handler__" in input;
}

export function toEventHandler(
  input: any,
  _?: any,
  _route?: string,
): EventHandler {
  if (!isEventHandler(input)) {
    // eslint-disable-next-line no-console
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? "\n" + `     Route: ${_route}` : "",
      "\n" + `     Handler: ${input}`,
    );
  }
  return input;
}

export interface DynamicEventHandler extends EventHandler {
  set: (handler: EventHandler) => void;
}

export function dynamicEventHandler(
  initial?: EventHandler,
): DynamicEventHandler {
  let current: EventHandler | undefined = initial;
  const wrapper = eventHandler((event) => {
    if (current) {
      return current(event);
    }
  }) as DynamicEventHandler;
  wrapper.set = (handler) => {
    current = handler;
  };
  return wrapper;
}

export function defineLazyEventHandler<T extends LazyEventHandler>(
  factory: T,
): Awaited<ReturnType<T>> {
  let _promise: Promise<EventHandler>;
  let _resolved: EventHandler;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r: any) => {
        const handler = r.default || r;
        if (typeof handler !== "function") {
          throw new (TypeError as any)(
            "Invalid lazy handler result. It should be a function:",
            handler,
          );
        }
        _resolved = toEventHandler(r.default || r);
        return _resolved;
      });
    }
    return _promise;
  };
  return eventHandler((event) => {
    if (_resolved) {
      return _resolved(event);
    }
    return resolveHandler().then((handler) => handler(event));
  }) as Awaited<ReturnType<T>>;
}
export const lazyEventHandler = defineLazyEventHandler;
