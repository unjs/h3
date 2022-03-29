import type http from 'http'
import { withoutTrailingSlash } from 'ufo'
import { lazyHandle, promisifyHandle } from './handle'
import { toEventHandler, createEvent } from './event'
import { createError, sendError } from './error'
import { send, sendStream, isStream, MIMES } from './utils'
import type { Handle, LazyHandle, Middleware, PHandle } from './handle'
import type { H3EventHandler, H3CompatibilityEvent } from './event'

export interface Layer {
  route: string
  match?: Matcher
  handler: H3EventHandler
}

export type Stack = Layer[]

export interface InputLayer {
  route?: string
  match?: Matcher
  handler: Handle | LazyHandle
  lazy?: boolean
  promisify?: boolean
}

export type InputStack = InputLayer[]

export type Matcher = (url: string, event?: H3CompatibilityEvent) => boolean

export type RequestHandler = H3EventHandler | Handle | Middleware

export interface AppUse {
  (route: string | string [], handler: RequestHandler | RequestHandler[], options?: Partial<InputLayer>): App
  (handler: RequestHandler | Handle[], options?: Partial<InputLayer>): App
  (options: InputLayer): App
}

export type AppHandler = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<any>

export interface App extends AppHandler {
  stack: Stack
  _handler: PHandle
  use: AppUse
}

export interface AppOptions {
  debug?: boolean
  onError?: (error: Error, event: H3CompatibilityEvent) => any
}

export function createApp (options: AppOptions = {}): App {
  const stack: Stack = []

  const _handler = createHandle(stack, options)

  const app: App = function (req, res) {
    const event = createEvent(req, res)
    return _handler(event).catch((error: Error) => {
      if (options.onError) {
        return options.onError(error, event)
      }
      return sendError(event, error, !!options.debug)
    })
  } as App

  app.stack = stack
  app._handler = _handler

  // @ts-ignore
  app.use = (arg1, arg2, arg3) => use(app as App, arg1, arg2, arg3)

  return app as App
}

export function use (
  app: App,
  arg1: string | Handle | InputLayer | InputLayer[],
  arg2?: Handle | Partial<InputLayer> | Handle[] | Middleware | Middleware[],
  arg3?: Partial<InputLayer>
) {
  if (Array.isArray(arg1)) {
    arg1.forEach(i => use(app, i, arg2, arg3))
  } else if (Array.isArray(arg2)) {
    arg2.forEach(i => use(app, arg1, i, arg3))
  } else if (typeof arg1 === 'string') {
    app.stack.push(normalizeLayer({ ...arg3, route: arg1, handler: arg2 as Handle }))
  } else if (typeof arg1 === 'function') {
    app.stack.push(normalizeLayer({ ...arg2, route: '/', handler: arg1 as Handle }))
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }))
  }
  return app
}

export function createHandle (stack: Stack, options: AppOptions) {
  const spacing = options.debug ? 2 : undefined
  return async function handle (event: H3CompatibilityEvent) {
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
  }
}

function normalizeLayer (input: InputLayer) {
  if (input.promisify === undefined) {
    input.promisify = input.handler.length > 2 /* req, res, next */
  }

  const handle = input.lazy
    ? lazyHandle(input.handler as LazyHandle, input.promisify)
    : (input.promisify ? promisifyHandle(input.handler) : input.handler)

  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler: toEventHandler(handle)
  }
}
