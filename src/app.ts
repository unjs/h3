import type {
  App,
  AppConfig,
  EventHandler,
  HTTPMethod,
  H3Event,
} from "./types";
import type { AppEntry } from "./types/app";
import {
  createRouter,
  addRoute,
  findAllRoutes,
  RouterContext,
  findRoute,
} from "rou3";
import { _kRaw } from "./event";
import { getPathname } from "./utils/internal/path";
import { ResolvedEventHandler } from "./types/handler";
import { prepareResponse } from "./response";
import { createError } from "./error";

/**
 * Create a new h3 app instance.
 */
export function createApp(options: AppConfig = {}): App {
  const app = new H3App(options);
  return app;
}

class H3App implements App {
  config: AppConfig;

  _globalMiddleware: undefined | AppEntry[];
  _middlewareRouter: undefined | RouterContext<AppEntry>;
  _router: RouterContext<AppEntry>;

  constructor(config: AppConfig) {
    this.config = config;

    this._middlewareRouter = createRouter<AppEntry>();
    this._router = createRouter<AppEntry>();

    this.handler = this.handler.bind(this);
    (this.handler as EventHandler).__resolve__ = this.resolve.bind(this);
  }

  get websocket() {
    return {
      ...this.config.websocket,
      resolve: async (info: { url: string; method?: string }) => {
        const pathname = getPathname(info.url || "/");
        const method = (info.method || "GET") as HTTPMethod;
        const resolved = await this.resolve(method, pathname);
        return resolved?.handler?.__websocket__ || {};
      },
    };
  }

  async handler(event: H3Event) {
    const pathname = event.path.split("?")[0];

    try {
      // 1. Hooks
      if (this.config.onRequest) {
        await this.config.onRequest(event);
      }

      // 1. Global middleware
      const _globalMiddleware = this._globalMiddleware;
      if (_globalMiddleware) {
        for (const entry of _globalMiddleware) {
          const result = await entry.handler(event);
          if (result !== undefined) {
            return prepareResponse(event, result, this.config);
          }
        }
      }

      // 2. Middleware router
      const _middlewareRouter = this._middlewareRouter;
      if (_middlewareRouter) {
        const matches = findAllRoutes(
          _middlewareRouter,
          event.method,
          pathname,
        );
        for (const match of matches) {
          const middleware = match.data;
          const result = await middleware.handler(event);
          if (result !== undefined) {
            return prepareResponse(event, result, this.config);
          }
        }
      }

      // 3. Route handler
      const match = findRoute(this._router, event.method, pathname)?.[0];
      if (match) {
        event.context.params = match.params;
        event.context.matchedRoute = match.data;
        const response = await match.data.handler(event);
        return prepareResponse(event, response, this.config);
      }
    } catch (error) {
      return prepareResponse(event, error, this.config);
    }

    // 404
    return prepareResponse(
      event,
      createError({
        statusCode: 404,
        unhandled: false,
        statusMessage: `Cannot find any route matching [${event.method}] ${pathname}`,
      }),
      this.config,
    );
  }

  async resolve(
    method: HTTPMethod,
    path: string,
  ): Promise<Partial<ResolvedEventHandler> | undefined> {
    const match =
      (this._middlewareRouter &&
        findAllRoutes(this._middlewareRouter, method, path)?.pop()) ||
      (this._router && findRoute(this._router, method, path)?.pop());
    if (!match) {
      return undefined;
    }

    if (match.data.handler.__resolve__) {
      return match.data.handler.__resolve__(method, path);
    }

    const resolved = {
      route: match.data.route,
      handler: match.data.handler,
      params: match.params,
    };

    if (resolved.handler.__resolve__) {
      const _resolved = await resolved.handler.__resolve__(method, path);
      return { ...resolved, ..._resolved };
    }

    return resolved;
  }

  use(
    arg1: string | EventHandler | AppEntry,
    arg2?: EventHandler | EventHandler[] | Partial<AppEntry>,
    arg3?: Partial<AppEntry>,
  ) {
    const arg1T = typeof arg1;
    const entry = {} as AppEntry;
    let _handler: EventHandler | App;
    if (arg1T === "string") {
      // (prefix, handler, details)
      entry.route = (arg1 as string) || arg3?.route;
      entry.method = arg3?.method as HTTPMethod;
      _handler = (arg2 as EventHandler | App) || arg3?.handler;
    } else if (arg1T === "function") {
      // (handler, details)
      entry.route = (arg2 as AppEntry)?.route;
      entry.method = (arg2 as AppEntry)?.method;
      _handler = (arg1 as EventHandler | App) || (arg2 as AppEntry)?.handler;
    } else {
      // (details)
      entry.route = (arg1 as AppEntry).route;
      entry.method = (arg1 as AppEntry).method;
      _handler = (arg1 as AppEntry).handler;
    }
    entry.handler = (_handler as App)?.handler || _handler;
    if (entry.route) {
      // Routed middleware/handler
      if (!this._middlewareRouter) {
        this._middlewareRouter = createRouter();
      }
      addRoute(this._middlewareRouter, entry.method, entry.route, entry);
    } else {
      // Global middleware
      if (!this._globalMiddleware) {
        this._globalMiddleware = [];
      }
      this._globalMiddleware.push(entry);
    }
    return this;
  }

  _findRoute(method: HTTPMethod = "GET", path = "/") {
    // Remove query parameters for matching
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    return findRoute(this._router, method, path)?.[0];
  }

  add(
    method: HTTPMethod | Lowercase<HTTPMethod> | "",
    path: string,
    handler: EventHandler,
  ): this {
    const _method = (method || "").toUpperCase();
    addRoute(this._router, _method, path, <RouterEntry>{
      method: _method,
      route: path,
      handler,
    });
    return this;
  }

  all(path: string, handler: EventHandler) {
    return this.add("", path, handler);
  }

  get(path: string, handler: EventHandler) {
    return this.add("GET", path, handler);
  }

  post(path: string, handler: EventHandler) {
    return this.add("POST", path, handler);
  }

  put(path: string, handler: EventHandler) {
    return this.add("PUT", path, handler);
  }

  delete(path: string, handler: EventHandler) {
    return this.add("DELETE", path, handler);
  }

  patch(path: string, handler: EventHandler) {
    return this.add("PATCH", path, handler);
  }

  head(path: string, handler: EventHandler) {
    return this.add("HEAD", path, handler);
  }

  options(path: string, handler: EventHandler) {
    return this.add("OPTIONS", path, handler);
  }

  connect(path: string, handler: EventHandler) {
    return this.add("CONNECT", path, handler);
  }

  trace(path: string, handler: EventHandler) {
    return this.add("TRACE", path, handler);
  }
}
