import {
  createRouter as _createRouter,
  toRouteMatcher,
  RouteMatcher,
} from "radix3";
import { withLeadingSlash } from "ufo";
import type { HTTPMethod, EventHandler } from "./types";
import { createError } from "./error";
import { eventHandler, toEventHandler } from "./event";

export type RouterMethod = Lowercase<HTTPMethod>;
const RouterMethods: RouterMethod[] = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch",
];

export type RouterUse = (
  path: string,
  handler: EventHandler,
  method?: RouterMethod | RouterMethod[],
) => Router;
export type AddRouteShortcuts = Record<RouterMethod, RouterUse>;

export interface Router extends AddRouteShortcuts {
  add: RouterUse;
  use: RouterUse;
  handler: EventHandler;
}

export interface RouteNode {
  handlers: Partial<Record<RouterMethod | "all", EventHandler>>;
  path: string;
}

export interface CreateRouterOptions {
  /** @deprecated Please use `preemptive` instead. **/
  preemtive?: boolean;
  preemptive?: boolean;
}

/**
 * Create a new h3 router instance.
 */
export function createRouter(opts: CreateRouterOptions = {}): Router {
  const _router = _createRouter<RouteNode>({});
  const routes: Record<string, RouteNode> = {};

  let _matcher: RouteMatcher | undefined;

  const router: Router = {} as Router;

  // Utilities to add a new route
  const addRoute = (
    path: string,
    handler: EventHandler,
    method: RouterMethod | RouterMethod[] | "all",
  ) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler, undefined, path);
    }
    return router;
  };

  router.use = router.add = (path, handler, method) =>
    addRoute(path, handler as EventHandler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }

  // Handler matcher
  const matchHandler = (path = "/", method: RouterMethod = "get") => {
    // Remove query parameters for matching
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }

    // Match route
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`,
        }),
      };
    }

    // Match method
    let handler: EventHandler | undefined =
      matched.handlers[method] || matched.handlers.all;

    // Fallback to search for (method) shadowed routes
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      // Default order is less specific to most specific
      const _matches = _matcher.matchAll(path).reverse() as RouteNode[];
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }

    if (!handler) {
      return {
        error: createError({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`,
        }),
      };
    }

    return { matched, handler };
  };

  // Main handle
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler((event) => {
    // Match handler
    const match = matchHandler(
      event.path,
      event.method.toLowerCase() as RouterMethod,
    );

    // No match (method or route)
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return; // Let app match other handlers
      }
    }

    // Add matched route and params to the context
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;

    // Call handler
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === undefined && isPreemptive) {
        return null; // Send empty content
      }
      return res;
    });
  });

  // Resolver
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler,
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };

  return router;
}
