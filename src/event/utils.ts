import type {
  EventHandler,
  LazyEventHandler,
  TypedEventInputSignature,
} from "../types";

export function defineEventHandler<
  Input extends TypedEventInputSignature = TypedEventInputSignature,
  Return = any
>(handler: EventHandler<Input, Return>): EventHandler<Input, Return>;
// TODO: remove when appropriate
// This signature provides backwards compatibility with previous signature where first generic was return type
export function defineEventHandler<
  Input = TypedEventInputSignature,
  Return = any
>(
  handler: EventHandler<
    Input extends TypedEventInputSignature ? Input : any,
    Input extends TypedEventInputSignature ? Return : Input
  >
): EventHandler<
  Input extends TypedEventInputSignature ? Input : any,
  Input extends TypedEventInputSignature ? Return : Input
>;
export function defineEventHandler<
  Input extends TypedEventInputSignature = TypedEventInputSignature,
  Return = any
>(handler: EventHandler<Input, Return>): EventHandler<Input, Return> {
  handler.__is_handler__ = true;
  return handler;
}
export const eventHandler = defineEventHandler;

export function isEventHandler(input: any): input is EventHandler {
  return "__is_handler__" in input;
}

export function toEventHandler(
  input: any,
  _?: any,
  _route?: string
): EventHandler {
  if (!isEventHandler(input)) {
    // eslint-disable-next-line no-console
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? "\n" + `     Route: ${_route}` : "",
      "\n" + `     Handler: ${input}`
    );
  }
  return input;
}

export interface DynamicEventHandler extends EventHandler {
  set: (handler: EventHandler) => void;
}

export function dynamicEventHandler(
  initial?: EventHandler
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
  factory: T
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
            handler
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
