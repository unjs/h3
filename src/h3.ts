import type {
  H3,
  H3Config,
  EventHandler,
  HTTPMethod,
  H3Event,
  H3EventContext,
  EventHandlerRequest,
} from "./types";
import type { H3Route } from "./types/h3";
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
import { _kNotFound, prepareResponse } from "./response";
import { _normalizeResponse } from "./adapters/web/_internal";

/**
 * Create a new h3 instance.
 */
export function createH3(config: H3Config = {}): H3 {
  return new _H3(config);
}

class _H3 implements H3 {
  config: H3Config;

  _middleware?: H3Route[];
  _mRouter?: RouterContext<H3Route>;
  _router?: RouterContext<H3Route>;

  handler: EventHandler<EventHandlerRequest, Promise<unknown>>;

  constructor(config: H3Config) {
    this.config = config;

    this.fetch = this.fetch.bind(this);

    this.handler = Object.assign((event: H3Event) => this._handler(event), <
      Partial<EventHandler>
    >{
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
    options?: RequestInit & { h3?: H3EventContext },
  ): Promise<Response> {
    // Normalize request
    let request: Request;
    if (typeof _request === "string") {
      let url = _request;
      if (url[0] === "/") {
        url = `http://localhost${url}`;
      }
      request = new Request(url, options);
    } else if (options || _request instanceof URL) {
      request = new Request(_request, options);
    } else {
      request = _request;
    }

    // Create event context
    const rawEvent = new WebEvent(request);
    const event = new EventWrapper(rawEvent, options?.h3);

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
        if (result !== undefined && result !== _kNotFound) {
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
        if (result !== undefined && result !== _kNotFound) {
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
    return _kNotFound;
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

  all(route: string, handler: EventHandler | H3) {
    return this.on("", route, handler);
  }
  get(route: string, handler: EventHandler | H3) {
    return this.on("GET", route, handler);
  }
  post(route: string, handler: EventHandler | H3) {
    return this.on("POST", route, handler);
  }
  put(route: string, handler: EventHandler | H3) {
    return this.on("PUT", route, handler);
  }
  delete(route: string, handler: EventHandler | H3) {
    return this.on("DELETE", route, handler);
  }
  patch(route: string, handler: EventHandler | H3) {
    return this.on("PATCH", route, handler);
  }
  head(route: string, handler: EventHandler | H3) {
    return this.on("HEAD", route, handler);
  }
  options(route: string, handler: EventHandler | H3) {
    return this.on("OPTIONS", route, handler);
  }
  connect(route: string, handler: EventHandler | H3) {
    return this.on("CONNECT", route, handler);
  }
  trace(route: string, handler: EventHandler | H3) {
    return this.on("TRACE", route, handler);
  }
  on(
    method: HTTPMethod | Lowercase<HTTPMethod> | "",
    route: string,
    handler: EventHandler | H3,
  ): this {
    if (!this._router) {
      this._router = createRouter();
    }
    const _method = (method || "").toUpperCase();
    const _handler = (handler as H3)?.handler || handler;
    addRoute(this._router, _method, route, <H3Route>{
      method: _method,
      route,
      handler: _handler,
    });
    return this;
  }

  use(
    arg1: string | EventHandler | H3 | H3Route,
    arg2?: EventHandler | H3 | Partial<H3Route>,
    arg3?: Partial<H3Route>,
  ) {
    const arg1T = typeof arg1;
    const entry = {} as H3Route;
    let _handler: EventHandler | H3;
    if (arg1T === "string") {
      // (route, handler, details)
      entry.route = (arg1 as string) || arg3?.route;
      entry.method = arg3?.method as HTTPMethod;
      _handler = (arg2 as EventHandler | H3) || arg3?.handler;
    } else if (arg1T === "function") {
      // (handler, details)
      entry.route = (arg2 as H3Route)?.route;
      entry.method = (arg2 as H3Route)?.method;
      _handler = (arg1 as EventHandler | H3) || (arg2 as H3Route)?.handler;
    } else {
      // (details)
      entry.route = (arg1 as H3Route).route;
      entry.method = (arg1 as H3Route).method;
      _handler = (arg1 as H3Route).handler;
    }

    entry.handler = (_handler as H3)?.handler || _handler;
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
