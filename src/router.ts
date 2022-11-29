import { createRouter as _createRouter } from "radix3";
import type { HTTPMethod, EventHandler } from "./types";
import { createError } from "./error";
import { eventHandler, toEventHandler } from "./event";

export type RouterMethod = Lowercase<HTTPMethod>
const RouterMethods = ["connect", "delete", "get", "head", "options", "post", "put", "trace", "patch"] as const satisfies readonly RouterMethod[];

export type RouterUse = (path: string, handler: EventHandler, method?: RouterMethod | RouterMethod[]) => Router
export type AddRouteShortcuts = Record<RouterMethod, RouterUse>

export interface Router extends AddRouteShortcuts {
  add: RouterUse
  use: RouterUse
  handler: EventHandler
}

interface RouteNode {
  handlers: Partial<Record<RouterMethod | "all", EventHandler>>
}

export interface CreateRouterOptions {
  preemtive?: boolean
}

// Currently duplicate code
type ToSingle<T> = T extends Array<infer U> ? U : T
function toArrayIfSingle<Target extends ToSingle<Actual>, Actual> (v: Actual): Target[] {
  if (Array.isArray(v)) {
    return v;
  }
  return [v as ToSingle<Actual>] as Target[];
}

export function createRouter (opts: CreateRouterOptions = {}): Router {
  const _router = _createRouter<RouteNode>({});
  const routes: Record<string, RouteNode> = {};

  const router: Router = {} as Router;

  // Utilities to add a new route
  const addRoute = (path: string, handler: EventHandler, method: RouterMethod | RouterMethod[] | "all") => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { handlers: {} };
      _router.insert(path, route);
    }
    for (const m of toArrayIfSingle(method)) {
      route.handlers[m] = toEventHandler(eventHandler(handler), undefined, path);
    }
    return router;
  };

  router.use = router.add = (path, handler, method) => addRoute(path, handler as EventHandler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }

  // Main handler
  router.handler = eventHandler((event) => {
    // Remove query parameters for matching
    let path = event.node.req.url || "/";
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, qIndex);
    }

    // Match route
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      if (opts.preemtive) {
        throw createError({
          statusCode: 404,
          name: "Not Found",
          statusMessage: "[Router] Cannot find any route matching"
        });
      } else {
        return; // Let app match other handlers
      }
    }

    // Match method
    const method = (event.node.req.method?.toLowerCase() ?? "get") as RouterMethod;
    const handler = matched.handlers[method] ?? matched.handlers.all;
    if (!handler) {
      throw createError({
        statusCode: 405,
        name: "Method Not Allowed",
        statusMessage: `Method ${method} is not allowed on this route. ` +
        // If property 'all' exists, then the following message won't be triggered anyway, thus no need to check
        `Allowed methods are: [${Object.keys(matched.handlers).map(v => v.toUpperCase()).join(", ")}]`
      });
    }

    // Add params
    event.context.params = matched.params ?? {};

    // Call handler
    return handler(event);
  });

  return router;
}
