import { createRouter as _createRouter } from 'radix3'
import type { HTTPMethod, EventHandler } from './types'
import { createError } from './error'
import { eventHandler, toEventHandler } from './event'

export type RouterMethod = Lowercase<HTTPMethod>
const RouterMethods: RouterMethod[] = ['connect', 'delete', 'get', 'head', 'options', 'post', 'put', 'trace', 'patch']

export type RouterUse = (path: string, handler: EventHandler, method?: RouterMethod | RouterMethod[]) => Router
export type AddRouteShortcuts = Record<RouterMethod, RouterUse>

export interface Router extends AddRouteShortcuts {
  add: RouterUse
  use: RouterUse
  handler: EventHandler
}

interface RouteNode {
  handlers: Partial<Record<RouterMethod | 'all', EventHandler>>
}

export interface CreateRouterOptions {
  preemtive?: boolean
}

export function createRouter (opts: CreateRouterOptions = {}): Router {
  const _router = _createRouter<RouteNode>({})
  const routes: Record<string, RouteNode> = {}

  const router: Router = {} as Router

  // Utilities to add a new route
  const addRoute = (path: string, handler: EventHandler, method: RouterMethod | RouterMethod[] | 'all') => {
    let route = routes[path]
    if (!route) {
      routes[path] = route = { handlers: {} }
      _router.insert(path, route)
    }
    if (Array.isArray(method)) {
      method.forEach(m => addRoute(path, handler, m))
    } else {
      route.handlers[method] = toEventHandler(handler, null, path)
    }
    return router
  }

  router.use = router.add = (path, handler, method) => addRoute(path, handler as EventHandler, method || 'all')
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method)
  }

  // Main handle
  router.handler = eventHandler((event) => {
    // Match route

    // Remove query parameters for matching
    let path = event.req.url || '/'
    const queryUrlIndex = path.lastIndexOf('?')
    if (queryUrlIndex > -1) {
      path = path.substring(0, queryUrlIndex)
    }

    const matched = _router.lookup(path)
    if (!matched) {
      if (opts.preemtive) {
        throw createError({
          statusCode: 404,
          name: 'Not Found',
          statusMessage: `Cannot find any route matching ${event.req.url || '/'}.`
        })
      } else {
        return // Let app match other handlers
      }
    }

    // Match method
    const method = (event.req.method || 'get').toLowerCase() as RouterMethod
    const handler = matched.handlers[method] || matched.handlers.all
    if (!handler) {
      throw createError({
        statusCode: 405,
        name: 'Method Not Allowed',
        statusMessage: `Method ${method} is not allowed on this route.`
      })
    }

    // Add params
    const params = matched.params || {}
    event.context.params = params

    // Call handler
    return handler(event)
  })

  return router
}
