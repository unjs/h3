import type {
  Stack,
  EventHandlerResolver,
  LazyEventHandler,
  InputLayer,
  Layer,
  AppOptions,
  WebSocketOptions,
  App,
  EventHandler,
} from "../types";
import { _kRaw } from "../event";
import {
  defineLazyEventHandler,
  toEventHandler,
  isEventHandler,
} from "../handler";
import {
  getPathname,
  joinURL,
  withoutTrailingSlash,
} from "../utils/internal/path";

export function use(
  app: App,
  arg1: string | EventHandler | InputLayer | InputLayer[],
  arg2?: Partial<InputLayer> | EventHandler | EventHandler[],
  arg3?: Partial<InputLayer>,
) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 as EventHandler }),
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 as EventHandler }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}

export function createResolver(stack: Stack): EventHandlerResolver {
  return async (path: string) => {
    let _layerPath: string;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, undefined)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/"),
        };
      }
      return res;
    }
  };
}

export function normalizeLayer(input: InputLayer) {
  let handler = input.handler;
  // @ts-ignore
  if (handler.handler) {
    // @ts-ignore
    handler = handler.handler;
  }

  if (input.lazy) {
    handler = defineLazyEventHandler(handler as unknown as LazyEventHandler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, undefined, input.route);
  }

  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler,
  } as Layer;
}

export function resolveWebsocketOptions(
  evResolver: EventHandlerResolver,
  appOptions: AppOptions,
): WebSocketOptions {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const pathname = getPathname(info.url || "/");
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    },
  };
}

export function cachedFn<T>(fn: () => T): () => T {
  let cache: T;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
