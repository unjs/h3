import type {
  RouterOptions,
  EventHandler,
  HTTPMethod,
  RouterEntry,
  Router,
  H3Event,
} from "./types";
import {
  type RouterContext,
  createRouter as _createRouter,
  findRoute,
  addRoute,
} from "rou3";
import { createError } from "./error";

/**
 * Create a new h3 router instance.
 */
export function createRouter(opts: RouterOptions = {}): Router {
  return new H3Router(opts);
}

class H3Router implements Router {
  _router: RouterContext<RouterEntry>;
  _options: RouterOptions;
  constructor(opts: RouterOptions = {}) {
    this._router = _createRouter();
    this._options = opts;
    this.handler = this.handler.bind(this);
  }

  all(path: string, handler: EventHandler) {
    return this.add("", path, handler);
  }

  use(path: string, handler: EventHandler) {
    return this.all(path, handler);
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

  handler(event: H3Event) {
    // Match handler
    const match = this._findRoute(
      event.method.toUpperCase() as HTTPMethod,
      event.path,
    );

    // No match (method or route)
    if (!match) {
      if (this._options.preemptive) {
        throw createError({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching [${event.method}] ${event.path || "/"}`,
        });
      } else {
        return; // Let app match other handlers
      }
    }

    // Add matched route and params to the context
    event.context.matchedRoute = match.data;
    event.context.params = match.params || Object.create(null);

    // Call handler
    return Promise.resolve(match.data.handler(event)).then((res) => {
      if (res === undefined && this._options.preemptive) {
        return null; // Send empty content
      }
      return res;
    });
  }

  _findRoute(method: HTTPMethod = "GET", path = "/") {
    // Remove query parameters for matching
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    return findRoute(this._router, method, path) as
      | { data: RouterEntry; params?: Record<string, string> }
      | undefined;
  }

  async _resolveRoute(method: HTTPMethod = "GET", path: string) {
    const match = this._findRoute(method, path);
    if (!match) {
      return;
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
}
