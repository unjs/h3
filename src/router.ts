import {
  createRouter as _createRouter,
  toRouteMatcher,
  RouteMatcher,
} from "radix3";
import type { HTTPMethod, EventHandler } from "./types";
import { createError } from "./error";
import { eventHandler, toEventHandler } from "./event";
import { setResponseStatus } from "./utils";

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
  method?: RouterMethod | RouterMethod[]
) => Router;
export type AddRouteShortcuts = Record<RouterMethod, RouterUse>;

export interface Router extends AddRouteShortcuts {
  add: RouterUse;
  use: RouterUse;
  handler: EventHandler;
}

interface RouteNode {
  handlers: Partial<Record<RouterMethod | "all", EventHandler>>;
}

export interface CreateRouterOptions {
  /** @deprecated Please use `preemptive` instead. **/
  preemtive?: boolean;
  preemptive?: boolean;
}

export function createRouter(opts: CreateRouterOptions = {}): Router {
  const _router = _createRouter<RouteNode>({});
  let _matcher: RouteMatcher | undefined;
  const routes: Record<string, RouteNode> = {};

  const router: Router = {} as Router;

  // Utilities to add a new route
  const addRoute = (
    path: string,
    handler: EventHandler,
    method: RouterMethod | RouterMethod[] | "all"
  ) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { handlers: {} };
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

  // Main handle
  router.handler = eventHandler((event) => {
    // Remove query parameters for matching
    let path = event.path || "/";
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }

    // Match route
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      if (opts.preemptive || opts.preemtive) {
        throw createError({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${event.path || "/"}.`,
        });
      } else {
        return; // Let app match other handlers
      }
    }

    // Match method
    const method = (
      event.node.req.method || "get"
    ).toLowerCase() as RouterMethod;
    let handler = matched.handlers[method] || matched.handlers.all;

    // Fallback to search for shadowed routes
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      // Default order is less specific to most specific
      const matches = _matcher.matchAll(path).reverse() as RouteNode[];
      if (matches.length > 1) {
        const _match = matches.find(
          (m) => m.handlers[method] || m.handlers.all
        );
        handler = _match?.handlers[method] || _match?.handlers.all;
      }
    }

    // Method not matched
    if (!handler) {
      if (opts.preemptive || opts.preemtive) {
        throw createError({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`,
        });
      } else {
        return; // Let app match other handlers
      }
    }

    // Add params
    const params = matched.params || {};
    event.context.params = params;

    // Call handler
    return Promise.resolve(handler(event)).then((res) => {
      if (res === undefined && (opts.preemptive || opts.preemtive)) {
        setResponseStatus(event, 204);
        return "";
      }
      return res;
    });
  });

  return router;
}
