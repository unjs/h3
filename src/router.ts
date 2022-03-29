import { createRouter as _createRouter } from 'radix3'
import type { HTTPMethod } from './types'
import { createError } from './error'
import { defineEventHandler, EventHandler, toEventHandler } from './event'
import type { RequestHandler } from './app'

export type RouterMethod = Lowercase<HTTPMethod>
const RouterMethods: Lowercase<RouterMethod>[] = ['connect', 'delete', 'get', 'head', 'options', 'post', 'put', 'trace']

export type AddWithMethod = (path: string, handler: RequestHandler) => Router
export type AddRouteShortcuts = Record<Lowercase<HTTPMethod>, AddWithMethod>

export interface Router extends AddRouteShortcuts {
  add: (path: string, handler: RequestHandler, method?: RouterMethod | 'all') => Router
  handler: RequestHandler
}

interface RouteNode {
  handlers: Partial<Record<RouterMethod| 'all', EventHandler>>
}

export function createRouter (): Router {
  const _router = _createRouter<RouteNode>({})
  const routes: Record<string, RouteNode> = {}

  const router: Router = {} as Router

  // Utilities to add a new route
  router.add = (path, handler, method = 'all') => {
    let route = routes[path]
    if (!route) {
      routes[path] = route = { handlers: {} }
      _router.insert(path, route)
    }
    route.handlers[method] = toEventHandler(handler)
    return router
  }
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method)
  }

  // Main handle
  router.handler = defineEventHandler((event) => {
    // Match route

    // Remove query parameters for matching
    let path = event.req.url || '/'
    const queryUrlIndex = path.lastIndexOf('?')
    if (queryUrlIndex > -1) {
      path = path.substring(0, queryUrlIndex)
    }

    const matched = _router.lookup(path)

    if (!matched) {
      throw createError({
        statusCode: 404,
        name: 'Not Found',
        statusMessage: `Cannot find any route matching ${event.req.url || '/'}.`
      })
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
    event.event.params = matched.params || {}

    // Call handler
    return handler(event)
  })

  return router
}
