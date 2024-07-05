import {
  createRouter as _createRouter,
  findRoute as _findRoute,
  addRoute as _addRoute,
} from "rou3";
import type {
  CreateRouterOptions,
  EventHandler,
  RouteNode,
  Router,
  RouterMethod,
} from "./types";
import { createError } from "./error";
import { defineEventHandler } from "./handler";
import { withLeadingSlash } from "./utils/internal/path";

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

/**
 * Create a new h3 router instance.
 */
export function createRouter(opts: CreateRouterOptions = {}): Router {
  const _router = _createRouter<RouteNode>();

  const router: Router = {} as Router;

  // Utility to add a new route
  function addRoute(
    path: string,
    handler: EventHandler,
    method: RouterMethod | RouterMethod[] | "" | undefined,
  ) {
    if (Array.isArray(method)) {
      for (const _method of method) {
        addRoute(path, handler, _method);
      }
    } else {
      const _method = (method || "").toLowerCase();
      _addRoute(_router, path, _method, <RouteNode>{
        handler,
        path,
        method: _method,
      });
    }
    return router;
  }

  // Shortcuts
  router.use = router.add = (path, handler, method) =>
    addRoute(path, handler as EventHandler, method);
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }

  // Handler matcher
  function matchRoute(
    path = "/",
    method: RouterMethod = "get",
  ): { error: Error } | { data: RouteNode; params?: Record<string, string> } {
    // Remove query parameters for matching
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    // Match route
    const match = _findRoute(_router, path, method);
    if (!match) {
      return {
        error: createError({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching [${method}] ${path || "/"}.`,
        }),
      };
    }
    return match as { data: RouteNode; params?: Record<string, string> };
  }

  // Main handle
  router.handler = defineEventHandler((event) => {
    // Match handler
    const match = matchRoute(
      event.path,
      event.method.toLowerCase() as RouterMethod,
    );

    // No match (method or route)
    if ("error" in match) {
      if (opts.preemptive) {
        throw match.error;
      } else {
        return; // Let app match other handlers
      }
    }

    // Add matched route and params to the context
    event.context.matchedRoute = match.data;
    event.context.params = match.params || Object.create(null);

    // Call handler
    return Promise.resolve(match.data.handler(event)).then((res) => {
      if (res === undefined && opts.preemptive) {
        return null; // Send empty content
      }
      return res;
    });
  });

  // Resolver
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchRoute(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.data.path,
      handler: match.data.handler,
    };
    if (match.data.handler.__resolve__) {
      const _res = await match.data.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };

  return router;
}
