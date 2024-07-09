import type {
  App,
  Stack,
  AppOptions,
  EventHandler,
  InputLayer,
  HTTPMethod,
  H3Event,
  Layer,
} from "./types";
import { _kRaw } from "./event";
import {
  getPathname,
  joinURL,
  withoutTrailingSlash,
} from "./utils/internal/path";
import { prepareResponse } from "./response";
import { createError } from "./error";
import { ResolvedEventHandler } from "./types/handler";

/**
 * Create a new h3 app instance.
 */
export function createApp(options: AppOptions = {}): App {
  const app = new H3App(options);
  return app;
}

class H3App implements App {
  stack: Stack = [];
  options: AppOptions;

  constructor(options: AppOptions) {
    this.options = options;
    this.handler = this.handler.bind(this);
    (this.handler as EventHandler).__resolve__ = this.resolve.bind(this);
  }

  get websocket() {
    return {
      ...this.options.websocket,
      resolve: async (info: { url: string; method?: string }) => {
        const pathname = getPathname(info.url || "/");
        const method = (info.method || "GET") as HTTPMethod;
        const resolved = await this.resolve(method, pathname);
        return resolved?.handler?.__websocket__ || {};
      },
    };
  }

  async handler(event: H3Event) {
    try {
      // Keep a copy of incoming url
      const _reqPath = event[_kRaw].path || "/";

      // Layer path is the path without the prefix
      let _layerPath: string;

      // Call onRequest hook
      if (this.options.onRequest) {
        await this.options.onRequest(event);
      }

      // Run through stack
      for (const layer of this.stack) {
        // 1. Remove prefix from path
        if (layer.prefix.length > 1) {
          if (!_reqPath.startsWith(layer.prefix)) {
            continue;
          }
          _layerPath = _reqPath.slice(layer.prefix.length) || "/";
        } else {
          _layerPath = _reqPath;
        }

        // 2. Custom matcher
        if (layer.match && !layer.match(_layerPath, event)) {
          continue;
        }

        // 3. Update event path with layer path
        event[_kRaw].path = _layerPath;

        // 4. Handle request
        const val = await layer.handler(event);

        // 5. Handle response
        const _body = val === undefined ? undefined : await val;
        if (_body !== undefined) {
          return prepareResponse(event, _body, this.options);
        }
      }

      // Throw 404 is no handler in the stack responded
      throw createError({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`,
      });
    } catch (error: unknown) {
      return prepareResponse(event, error, this.options);
    }
  }

  async resolve(
    method: HTTPMethod,
    path: string,
  ): Promise<Partial<ResolvedEventHandler> | undefined> {
    let _layerPath: string;
    for (const layer of this.stack) {
      if (layer.prefix === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.prefix)) {
        continue;
      }
      _layerPath = path.slice(layer.prefix.length) || "/";
      if (layer.match && !layer.match(_layerPath, undefined)) {
        continue;
      }
      if (!layer.handler.__resolve__) {
        return {
          prefix: layer.prefix,
          handler: layer.handler,
          method,
        };
      }
      const _resolved = await layer.handler.__resolve__(method, _layerPath);
      if (!_resolved) {
        continue;
      }
      const prefix = joinURL(layer.prefix || "/", _resolved.prefix || "/");
      return {
        ..._resolved,
        method: _resolved.method || method,
        prefix,
        handler: _resolved.handler || layer.handler,
      };
    }
  }

  use(route: string, handler: EventHandler, options?: Partial<InputLayer>): App;
  use(handler: EventHandler, options?: Partial<InputLayer>): App;
  use(options: InputLayer): App;
  use(
    arg1: string | EventHandler | InputLayer,
    arg2?: EventHandler | EventHandler[] | Partial<InputLayer>,
    arg3?: Partial<InputLayer>,
  ) {
    const arg1T = typeof arg1;
    if (arg1T === "string") {
      this.stack.push(
        _normalizeLayer({
          ...arg3,
          prefix: arg1 as string,
          handler: arg2 as EventHandler,
        }),
      );
    } else if (arg1T === "function") {
      this.stack.push(
        _normalizeLayer({ ...arg2, handler: arg1 as EventHandler }),
      );
    } else {
      this.stack.push(_normalizeLayer(arg1 as InputLayer));
    }
    return this;
  }
}

function _normalizeLayer(input: InputLayer): Layer {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }

  return {
    prefix: withoutTrailingSlash(input.prefix),
    match: input.match,
    handler,
  } as Layer;
}
