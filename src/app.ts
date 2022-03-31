import type http from 'http'
import { withoutTrailingSlash } from 'ufo'
import { defineLazyEventHandler, toEventHandler, createEvent, isEventHandler, defineEventHandler } from './event'
import { createError, sendError, isError } from './error'
import { send, sendStream, isStream, MIMES } from './utils'
import type { Handler, LazyHandler, Middleware } from './types'
import type { EventHandler, CompatibilityEvent, CompatibilityEventHandler, LazyEventHandler } from './event'

export interface Layer {
  route: string
  match?: Matcher
  handler: EventHandler
}

export type Stack = Layer[]

export interface InputLayer {
  route?: string
  match?: Matcher
  handler: Handler | LazyHandler | EventHandler | LazyEventHandler
  lazy?: boolean
  /** @deprecated */
  handle?: Handler
  /** @deprecated */
  promisify?: boolean
}

export type InputStack = InputLayer[]

export type Matcher = (url: string, event?: CompatibilityEvent) => boolean

export interface AppUse {
  (route: string | string [], handler: CompatibilityEventHandler | CompatibilityEventHandler[], options?: Partial<InputLayer>): App
  (handler: CompatibilityEventHandler | CompatibilityEventHandler[], options?: Partial<InputLayer>): App
  (options: InputLayer): App
}

export type NodeHandler = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>

export interface App extends NodeHandler {
  stack: Stack
  handler: EventHandler
  nodeHandler: NodeHandler
  use: AppUse
}

export interface AppOptions {
  debug?: boolean
  onError?: (error: Error, event: CompatibilityEvent) => any
}

export function createApp (options: AppOptions = {}): App {
  const stack: Stack = []

  const handler = createAppEventHandler(stack, options)

  const nodeHandler: NodeHandler = async function (req, res) {
    const event = createEvent(req, res)
    try {
      await handler(event)
    } catch (err) {
      if (options.onError) {
        await options.onError(err as Error, event)
      }
      if (!isError(err)) {
        console.error('[h3]', err) // eslint-disable-line no-console
      }
      await sendError(event, err as Error, !!options.debug)
    }
  }

  const app = nodeHandler as App
  app.nodeHandler = nodeHandler
  app.stack = stack
  app.handler = handler

  // @ts-ignore
  app.use = (arg1, arg2, arg3) => use(app as App, arg1, arg2, arg3)

  return app as App
}

export function use (
  app: App,
  arg1: string | Handler | InputLayer | InputLayer[],
  arg2?: Handler | Partial<InputLayer> | Handler[] | Middleware | Middleware[],
  arg3?: Partial<InputLayer>
) {
  if (Array.isArray(arg1)) {
    arg1.forEach(i => use(app, i, arg2, arg3))
  } else if (Array.isArray(arg2)) {
    arg2.forEach(i => use(app, arg1, i, arg3))
  } else if (typeof arg1 === 'string') {
    app.stack.push(normalizeLayer({ ...arg3, route: arg1, handler: arg2 as Handler }))
  } else if (typeof arg1 === 'function') {
    app.stack.push(normalizeLayer({ ...arg2, route: '/', handler: arg1 as Handler }))
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }))
  }
  return app
}

export function createAppEventHandler (stack: Stack, options: AppOptions) {
  const spacing = options.debug ? 2 : undefined
  return defineEventHandler(async (event) => {
    event.req.originalUrl = event.req.originalUrl || event.req.url || '/'
    const reqUrl = event.req.url || '/'
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!reqUrl.startsWith(layer.route)) {
          continue
        }
        event.req.url = reqUrl.slice(layer.route.length) || '/'
      } else {
        event.req.url = reqUrl
      }
      if (layer.match && !layer.match(event.req.url as string, event)) {
        continue
      }
      const val = await layer.handler(event)
      if (event.res.writableEnded) {
        return
      }
      const type = typeof val
      if (type === 'string') {
        return send(event, val, MIMES.html)
      } else if (isStream(val)) {
        return sendStream(event, val)
      } else if (type === 'object' || type === 'boolean' || type === 'number' /* IS_JSON */) {
        if (val && (val as Buffer).buffer) {
          return send(event, val)
        } else if (val instanceof Error) {
          throw createError(val)
        } else {
          return send(event, JSON.stringify(val, null, spacing), MIMES.json)
        }
      }
    }
    if (!event.res.writableEnded) {
      throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
  })
}

function normalizeLayer (input: InputLayer) {
  let handler = input.handler || input.handle
  // @ts-ignore
  if (handler.handler) {
    // @ts-ignore
    handler = handler.handler
  }

  if (input.lazy) {
    handler = defineLazyEventHandler(handler as LazyEventHandler)
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler)
  }

  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  } as Layer
}
