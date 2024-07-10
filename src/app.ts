import type {
  App,
  AppConfig,
  EventHandler,
  HTTPMethod,
  H3Event,
  H3EventContext,
  EventHandlerRequest,
} from "./types";
import type { AppEntry } from "./types/app";
import {
  createRouter,
  addRoute,
  findAllRoutes,
  RouterContext,
  findRoute,
} from "rou3";
import { _kRaw, EventWrapper } from "./event";
import { getPathname, joinURL } from "./utils/internal/path";
import { ResolvedEventHandler } from "./types/handler";
import { WebEvent } from "./adapters/web/event";
import { prepareResponse } from "./response";
import { _normalizeResponse } from "./adapters/web/_internal";
import { createError } from "./error";

/**
 * Create a new h3 app instance.
 */
export function createApp(config: AppConfig = {}): App {
  return new H3App(config);
}

class H3App implements App {
  config: AppConfig;

  _middleware?: AppEntry[];
  _mRouter?: RouterContext<AppEntry>;
  _router?: RouterContext<AppEntry>;

  handler: EventHandler<EventHandlerRequest, Promise<unknown>>;

  constructor(config: AppConfig) {
    this.config = config;

    this.fetch = this.fetch.bind(this);

    this.handler = Object.assign((event: H3Event) => this._handler(event), <
      Partial<EventHandler>
    >{
      __is_handler__: true,
      resolve: (method, path) => this.resolve(method, path),
      websocket: this.config.websocket,
    });
  }

  get websocket() {
    return {
      ...this.config.websocket,
      resolve: async (info: { url: string; method?: string }) => {
        const pathname = getPathname(info.url || "/");
        const method = (info.method || "GET") as HTTPMethod;
        const resolved = await this.resolve(method, pathname);
        return resolved?.handler?.websocket?.hooks || {};
      },
    };
  }

  async fetch(
    _request: Request | URL | string,
    details?: RequestInit & { h3?: { context?: H3EventContext } },
  ): Promise<Response> {
    // Normalize request
    let request: Request;
    if (typeof _request === "string") {
      let url = _request;
      if (url[0] === "/") {
        url = `http://localhost${url}`;
      }
      request = new Request(url, details);
    } else if (_request instanceof URL) {
      request = new Request(_request.toString(), details);
    } else {
      request = _request;
    }

    // Create event context
    const rawEvent = new WebEvent(request);
    const event = new EventWrapper(rawEvent, details?.h3?.context);

    // Handle request
    const _res = await this._handler(event)
      .catch((error: any) => error)
      .then((res) => prepareResponse(event, res, this.config));

    // Create response
    const status = rawEvent.responseCode;
    // prettier-ignore
    // https://developer.mozilla.org/en-US/docs/Web/API/Response/body
    const isNullBody = status === 101 || status === 204 || status === 205 || status === 304 || request.method === "HEAD";
    return new Response(isNullBody ? null : _normalizeResponse(_res), {
      status,
      statusText: rawEvent.responseMessage,
      headers: rawEvent.getResponseHeaders(),
    });
  }

  async _handler(event: H3Event) {
    // Get pathname
    const _path = event.path;
    const _queryIndex = _path.indexOf("?");
    const pathname = _queryIndex === -1 ? _path : _path.slice(0, _queryIndex);

    // 1. Hooks
    if (this.config.onRequest) {
      await this.config.onRequest(event);
    }

    // 2. Global middleware
    const _middleware = this._middleware;
    if (_middleware) {
      for (const entry of _middleware) {
        const result = await entry.handler(event);
        if (result !== undefined) {
          return result;
        }
      }
    }

    // 3. Middleware router
    const _mRouter = this._mRouter;
    if (_mRouter) {
      const matches = findAllRoutes(_mRouter, event.method, pathname);
      for (const match of matches) {
        const result = await match.data.handler(event);
        if (result !== undefined) {
          return result;
        }
      }
    }

    // 4. Route handler
    if (this._router) {
      const match = findRoute(this._router, event.method, pathname)?.[0];
      if (match) {
        event.context.params = match.params;
        event.context.matchedRoute = match.data;
        return match.data.handler(event);
      }
    }

    // 5. 404
    return createError({
      status: 404,
      statusText: `Cannot find any route matching [${event.method}] ${event.path}`,
    });
  }

  async resolve(
    method: HTTPMethod,
    path: string,
  ): Promise<ResolvedEventHandler | undefined> {
    const match =
      (this._mRouter && findRoute(this._mRouter, method, path)?.pop()) ||
      (this._router && findRoute(this._router, method, path)?.pop());

    if (!match) {
      return undefined;
    }

    const resolved = {
      route: match.data.route,
      handler: match.data.handler,
      params: match.params,
    };

    while (resolved.handler?.resolve) {
      const _resolved = await resolved.handler.resolve(method, path);
      if (!_resolved) {
        break;
      }
      if (_resolved.route) {
        let base = resolved.route || "";
        if (base.endsWith("/**")) {
          base = base.slice(0, -3);
        }
        resolved.route = joinURL(base, _resolved.route);
      }
      if (_resolved.params) {
        resolved.params = { ...resolved.params, ..._resolved.params };
      }
      if (!_resolved.handler || _resolved.handler === resolved.handler) {
        break;
      }
      resolved.handler = _resolved.handler;
    }

    return resolved;
  }

  all(route: string, handler: EventHandler | App) {
    return this.on("", route, handler);
  }
  get(route: string, handler: EventHandler | App) {
    return this.on("GET", route, handler);
  }
  post(route: string, handler: EventHandler | App) {
    return this.on("POST", route, handler);
  }
  put(route: string, handler: EventHandler | App) {
    return this.on("PUT", route, handler);
  }
  delete(route: string, handler: EventHandler | App) {
    return this.on("DELETE", route, handler);
  }
  patch(route: string, handler: EventHandler | App) {
    return this.on("PATCH", route, handler);
  }
  head(route: string, handler: EventHandler | App) {
    return this.on("HEAD", route, handler);
  }
  options(route: string, handler: EventHandler | App) {
    return this.on("OPTIONS", route, handler);
  }
  connect(route: string, handler: EventHandler | App) {
    return this.on("CONNECT", route, handler);
  }
  trace(route: string, handler: EventHandler | App) {
    return this.on("TRACE", route, handler);
  }
  on(
    method: HTTPMethod | Lowercase<HTTPMethod> | "",
    route: string,
    handler: EventHandler | App,
  ): this {
    if (!this._router) {
      this._router = createRouter();
    }
    const _method = (method || "").toUpperCase();
    const _handler = (handler as App)?.handler || handler;
    addRoute(this._router, _method, route, <AppEntry>{
      method: _method,
      route,
      handler: _handler,
    });
    return this;
  }

  use(
    arg1: string | EventHandler | App | AppEntry,
    arg2?: EventHandler | App | Partial<AppEntry>,
    arg3?: Partial<AppEntry>,
  ) {
    const arg1T = typeof arg1;
    const entry = {} as AppEntry;
    let _handler: EventHandler | App;
    if (arg1T === "string") {
      // (route, handler, details)
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
    entry.method = (entry.method || "").toUpperCase() as HTTPMethod;

    if (entry.route) {
      // Routed middleware/handler
      if (!this._mRouter) {
        this._mRouter = createRouter();
      }
      addRoute(this._mRouter, entry.method, entry.route, entry);
    } else {
      // Global middleware
      if (!this._middleware) {
        this._middleware = [];
      }
      this._middleware.push(entry);
    }
    return this;
  }
}
