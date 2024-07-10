import type {
  DynamicEventHandler,
  H3Event,
  RequestMiddleware,
  ResponseMiddleware,
} from "./types";
import type {
  EventHandler,
  EventHandlerRequest,
  EventHandlerResponse,
  EventHandlerObject,
} from "./types";
import { _kRaw } from "./event";
import { hasProp } from "./utils/internal/object";

type _EventHandlerHooks<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> = {
  onRequest?: RequestMiddleware<Request>[];
  onBeforeResponse?: ResponseMiddleware<Request, Response>[];
};

export function defineEventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response = EventHandlerResponse,
>(
  handler:
    | EventHandler<Request, Response>
    | EventHandlerObject<Request, Response>,
): EventHandler<Request, Response>;
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
>(
  handler:
    | EventHandler<Request, Response>
    | EventHandlerObject<Request, Response>,
): EventHandler<Request, Response> {
  // Function Syntax
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  // Object Syntax
  const _hooks: _EventHandlerHooks<Request, Response> = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse),
  };
  const _handler: EventHandler<Request, any> = (event: H3Event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.resolve = handler.handler.resolve;
  _handler.websocket = { hooks: handler.websocket };
  return _handler as EventHandler<Request, Response>;
}

function _normalizeArray<T>(input?: T | T[]): T[] | undefined {
  return input ? (Array.isArray(input) ? input : [input]) : undefined;
}

async function _callHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
>(
  event: H3Event,
  handler: EventHandler<Request, Response>,
  hooks: _EventHandlerHooks<Request, Response>,
): Promise<Awaited<Response> | undefined> {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}

export function defineRequestMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
>(fn: RequestMiddleware<Request>): RequestMiddleware<Request> {
  return fn;
}

export function defineResponseMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
>(fn: ResponseMiddleware<Request>): ResponseMiddleware<Request> {
  return fn;
}

/**
 * Checks if any kind of input is an event handler.
 * @param input The input to check.
 * @returns True if the input is an event handler, false otherwise.
 */
export function isEventHandler(input: any): input is EventHandler {
  return hasProp(input, "__is_handler__");
}

export function dynamicEventHandler(
  initial?: EventHandler,
): DynamicEventHandler {
  let current: EventHandler | undefined = initial;
  const wrapper = defineEventHandler((event) => {
    if (current) {
      return current(event);
    }
  }) as DynamicEventHandler;
  wrapper.set = (handler) => {
    current = handler;
  };
  return wrapper;
}

export function defineLazyEventHandler(
  load: () => Promise<EventHandler> | EventHandler,
): EventHandler {
  let _promise: Promise<typeof _resolved>;
  let _resolved: { handler: EventHandler };

  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(load()).then((r: any) => {
        const handler = r.default || r;
        if (typeof handler !== "function") {
          throw new (TypeError as any)(
            "Invalid lazy handler result. It should be a function:",
            handler,
          );
        }
        _resolved = { handler: r.default || r };
        return _resolved;
      });
    }
    return _promise;
  };

  const handler: EventHandler = (event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  };

  handler.resolve = (method, path) =>
    Promise.resolve(
      resolveHandler().then(({ handler }) =>
        handler.resolve ? handler.resolve(method, path) : { handler },
      ),
    );

  return handler;
}
