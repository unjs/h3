import { withoutTrailingSlash } from "ufo";
import { lazyEventHandler, toEventHandler, isEventHandler, eventHandler, H3Event } from "./event";
import { createError, h3Warn } from "./error";
import { send, sendStream, isStream, MIMES } from "./utils";
import type { EventHandler, LazyEventHandlerFactory } from "./types";
import { Router } from "./router";

export interface Layer {
  route: string
  match?: Matcher
  handler: EventHandler
}

export type Stack = Layer[]

type InputLayerNoLazy = {
  route?: string
  match?: Matcher
  handler: EventHandler
  lazy?: false
}

type InputLayerWithLazyHandler = {
  route?: string
  match?: Matcher
  handler: LazyEventHandlerFactory
  lazy: true
}

// Discriminated union
export type InputLayer = InputLayerWithLazyHandler | InputLayerNoLazy

type Matcher = (url: string, event?: H3Event) => boolean

export interface AppUse {
  // Make sure this is in sync with `use()`
  (options: InputLayer): App
  (handler: EventHandler | Router | LazyEventHandlerFactory | (EventHandler | Router| LazyEventHandlerFactory)[], options?: Partial<InputLayer>): App
  (route: string | string[], handler: EventHandler | Router | LazyEventHandlerFactory | (EventHandler | Router| LazyEventHandlerFactory)[], options?: Partial<InputLayer>): App
}

export interface AppOptions {
  debug?: boolean
  onError?: (error: Error, event: H3Event) => any
}

export interface App {
  stack: Stack
  handler: EventHandler
  options: AppOptions
  use: AppUse
}

type ToSingle<T> = T extends Array<infer U> ? U : T

function toArrayIfSingle<Target extends ToSingle<Actual>, Actual> (v: Actual): Target[] {
  if (Array.isArray(v)) {
    return v;
  }
  return [v as ToSingle<Actual>] as Target[];
}

function _isStringArray (v: unknown[]): v is string[] {
  return typeof v[0] === "string";
}

function _mapEventHandlersOrRoutersToEventHandlersOrLazyFactories (arr: (EventHandler | Router | LazyEventHandlerFactory)[]): (EventHandler | LazyEventHandlerFactory)[] {
  return arr.map((er) => {
    if ("__is_handler__" in er) {
      return er;
    }

    if (typeof er === "function") {
      // Is a factory
      return er;
    }

    // Is a router
    return eventHandler(er.handler);
  });
}

// Make sure this is in sync with interface AppUse {}
export function use (app: App, options: InputLayer): App;
// eslint-disable-next-line no-redeclare
export function use (app: App, handler: EventHandler | Router | LazyEventHandlerFactory | (EventHandler | LazyEventHandlerFactory | Router)[], options?: Partial<InputLayer>): App;
// eslint-disable-next-line no-redeclare
export function use (app: App, route: string | string[], handler: EventHandler | Router| LazyEventHandlerFactory | (EventHandler | Router| LazyEventHandlerFactory)[], options?: Partial<InputLayer>): App;
// eslint-disable-next-line no-redeclare
export function use (
  app: App,
  arg1:
  // Overload 1 use(InputLayer)
  | InputLayer
  // Overload 2 use(routes)
  | string | string[]
  // Overload 3 use(EventHandlers | Routers)
  | EventHandler | Router | LazyEventHandlerFactory | (EventHandler | Router| LazyEventHandlerFactory)[],
  arg2?:
  // Overload 2 use (eventHandlers)
  EventHandler | Router | LazyEventHandlerFactory | (EventHandler | Router| LazyEventHandlerFactory)[]
  // Overload 3
  | Partial<InputLayer>,
  arg3?:
  // Overload 3
  Partial<InputLayer>
) {
  let routes = ["/"];
  let handlers: (EventHandler | LazyEventHandlerFactory)[] = [];
  let inputLayer: Partial<InputLayer> = {};

  // Overload 1: use(InputLayer)
  if (typeof arg1 === "object" && "handler" in arg1) {
    inputLayer = arg1;
    app.stack.push(normalizeLayer({ ...arg1 }));
  // Overload 2 & 3
  } else {
    // Split into union arrays for later purposes
    const arg1Arr = toArrayIfSingle(arg1) as string[] | (EventHandler | Router)[];

    if (arg1Arr.length === 0) {
      // Do nothing, but give message
      if (typeof arg3 === "object" || typeof arg3 === "undefined") {
        // Currently in overload 2
        h3Warn("Array of handlers is empty");
      } else {
        // Currently in overload 3
        h3Warn("Array of routes is empty");
      }
    // Use first for type checking
    } else if (_isStringArray(arg1Arr)) {
      // Overload 3: use(routes, eventHandlers, options)
      routes = arg1Arr;
      const arg2Arr = toArrayIfSingle(arg2) as (EventHandler | Router)[];
      if (arg2Arr.length === 0) {
        h3Warn("Array of handlers is empty");
      } else {
        handlers = _mapEventHandlersOrRoutersToEventHandlersOrLazyFactories(arg2Arr);
      }
      inputLayer = arg3 ?? {};
    } else {
      // Overload 2: use(eventHandlers, options)
      handlers = _mapEventHandlersOrRoutersToEventHandlersOrLazyFactories(arg1Arr);
      inputLayer = (arg2 as Partial<InputLayer>) ?? {};
    }
  }

  for (const route of routes) {
    for (const handler of handlers) {
      if ("__is_handler__" in handler) {
        console.log("adding handler to", route);
        const il: InputLayer = {
          ...inputLayer,
          route,
          handler,
          // Is a handler, no need for lazy
          lazy: false
        };
        app.stack.push(normalizeLayer(il));
      } else {
        const il: InputLayer = {
          ...inputLayer,
          route,
          handler,
          // Is a lazy factory
          lazy: true
        };
        app.stack.push(normalizeLayer(il));
      }
    }
  }
  return app;
}

export function createApp (options: AppOptions = {}): App {
  const stack: Stack = [];
  const handler = createAppEventHandler(stack, options);
  const app: App = {
    // Design limitation of overloaded functions. Other than that, this is considered safe
    // @ts-ignore
    use: ((...args: any[]) => use(app, ...args as [any])) as AppUse,
    handler,
    stack,
    options
  };
  return app;
}

export function createAppEventHandler (stack: Stack, options: AppOptions) {
  const spacing = options.debug ? 2 : undefined;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const reqUrl = event.node.req.url || "/";
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!reqUrl.startsWith(layer.route)) {
          continue;
        }
        event.node.req.url = reqUrl.slice(layer.route.length) || "/";
      } else {
        event.node.req.url = reqUrl;
      }

      if (layer.match && !layer.match(event.node.req.url as string, event)) {
        continue;
      }

      const val = await layer.handler(event);
      if (event.node.res.writableEnded) {
        return;
      }

      const type = typeof val;
      if (type === "string") {
        return send(event, val, MIMES.html);
      } else if (isStream(val)) {
        return sendStream(event, val);
      } else if (val === null) {
        event.node.res.statusCode = 204;
        return send(event);
      } else if (type === "object" || type === "boolean" || type === "number" /* is json or buffer or error */) {
        // Check if buffer
        if (val instanceof Buffer) {
          return send(event, val);
        }

        // Check if error
        if (val instanceof Error) {
          throw createError(val);
        }

        // It is json
        return send(event, JSON.stringify(val, undefined, spacing), MIMES.json);
      }
    }
    if (!event.node.res.writableEnded) {
      throw createError({
        statusCode: 404,
        statusMessage: `[App] Cannot find any route matching ${event.node.req.url || "/"}.`
      });
    }
  });
}

function normalizeLayer (input: InputLayer) {
  let handler = input.handler;

  if (input.lazy) {
    if (!("__is_handler__" in handler)) {
      handler = lazyEventHandler(handler);
    }
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, undefined, input.route);
  }

  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  } as Layer;
}
