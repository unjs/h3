import { createRouter as _createRouter } from 'radix3'
import type { Handle } from './handle'
import type { HTTPMethod } from './types/http'
import { createError } from './error'

export type RouterMethod = Lowercase<HTTPMethod>
const RouterMethods: Lowercase<RouterMethod>[] = ['connect', 'delete', 'get', 'head', 'options', 'post', 'put', 'trace']

export type HandleWithParams = Handle<any, { params: Record<string, string> }>

export type AddWithMethod = (path: string, handle: HandleWithParams) => Router
export type AddRouteShortcuts = Record<Lowercase<HTTPMethod>, AddWithMethod>

export interface Router extends AddRouteShortcuts {
  add: (path: string, handle: HandleWithParams, method?: RouterMethod | 'all') => Router
  handle: Handle
}

interface RouteNode {
  handlers: Partial<Record<RouterMethod| 'all', HandleWithParams>>
}

export function createRouter (): Router {
  const _router = _createRouter<RouteNode>({})
  const routes: Record<string, RouteNode> = {}

  const router: Router = {} as Router

  // Utilities to add a new route
  router.add = (path, handle, method = 'all') => {
    let route = routes[path]
    if (!route) {
      routes[path] = route = { handlers: {} }
      _router.insert(path, route)
    }
    route.handlers[method] = handle
    return router
  }
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method)
  }

  // Main handle
  router.handle = (req, res) => {
    // Match route
    const matched = _router.lookup(req.url || '/')
    if (!matched) {
      throw createError({
        statusCode: 404,
        name: 'Not Found',
        statusMessage: `Cannot find any route matching ${req.url || '/'}.`
      })
    }

    // Match method
    const method = (req.method || 'get').toLowerCase() as RouterMethod
    const handler: HandleWithParams | undefined = matched.handlers[method] || matched.handlers.all
    if (!handler) {
      throw createError({
        statusCode: 405,
        name: 'Method Not Allowed',
        statusMessage: `Method ${method} is not allowed on this route.`
      })
    }

    // Add params
    req.params = matched.params || {}

    // Call handler
    return handler(req, res)
  }

  return router
}
