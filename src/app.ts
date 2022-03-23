import { withoutTrailingSlash } from 'ufo'
import { lazyHandle, promisifyHandle } from './handle'
import { toEventHandler, createEvent } from './event'
import { createError, sendError } from './error'
import { send, sendStream, isStream, MIMES } from './utils'
import type { IncomingMessage, ServerResponse } from './types/node'
import type { Handle, LazyHandle, Middleware, PHandle } from './handle'
import type { H3EventHandler } from './event'

export interface Layer {
  route: string
  match?: Matcher
  handler: H3EventHandler
}

export type Stack = Layer[]

export interface InputLayer {
  route?: string
  match?: Matcher
  handle: Handle | LazyHandle
  lazy?: boolean
  promisify?: boolean
}

export type InputStack = InputLayer[]

export type Matcher = (url: string, req?: IncomingMessage) => boolean

export interface AppUse {
  (route: string | string [], handle: Middleware | Middleware[], options?: Partial<InputLayer>): App
  (route: string | string[], handle: Handle | Handle[], options?: Partial<InputLayer>): App
  (handle: Middleware | Middleware[], options?: Partial<InputLayer>): App
  (handle: Handle | Handle[], options?: Partial<InputLayer>): App
  (options: InputLayer): App
}

export interface App {
  (req: IncomingMessage, res: ServerResponse): Promise<any>
  stack: Stack
  _handle: PHandle
  use: AppUse
}

export interface AppOptions {
  debug?: boolean
  onError?: (error: Error, req: IncomingMessage, res: ServerResponse) => any
}

export function createApp (options: AppOptions = {}): App {
  const stack: Stack = []

  const _handle = createHandle(stack, options)

  // @ts-ignore
  const app: Partial<App> = function (req: IncomingMessage, res: ServerResponse) {
    return _handle(req, res).catch((error: Error) => {
      if (options.onError) {
        return options.onError(error, req, res)
      }
      return sendError(res, error, !!options.debug)
    })
  }

  app.stack = stack
  app._handle = _handle

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
    app.stack.push(normalizeLayer({ ...arg3, route: arg1, handle: arg2 as Handle }))
  } else if (typeof arg1 === 'function') {
    app.stack.push(normalizeLayer({ ...arg2, route: '/', handle: arg1 as Handle }))
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }))
  }
  return app
}

export function createHandle (stack: Stack, options: AppOptions): PHandle {
  const spacing = options.debug ? 2 : undefined
  return async function handle (req: IncomingMessage, res: ServerResponse) {
    const event = createEvent(req, res)

    // @ts-ignore express/connect compatibility
    req.originalUrl = req.originalUrl || req.url || '/'
    const reqUrl = req.url || '/'
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!reqUrl.startsWith(layer.route)) {
          continue
        }
        req.url = reqUrl.slice(layer.route.length) || '/'
      } else {
        req.url = reqUrl
      }
      if (layer.match && !layer.match(req.url as string, req)) {
        continue
      }
      const val = await layer.handler(event)
      if (res.writableEnded) {
        return
      }
      const type = typeof val
      if (type === 'string') {
        return send(res, val, MIMES.html)
      } else if (isStream(val)) {
        return sendStream(res, val)
      } else if (type === 'object' || type === 'boolean' || type === 'number' /* IS_JSON */) {
        if (val && val.buffer) {
          return send(res, val)
        } else if (val instanceof Error) {
          throw createError(val)
        } else {
          return send(res, JSON.stringify(val, null, spacing), MIMES.json)
        }
      }
    }
    if (!res.writableEnded) {
      throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
  }
}

function normalizeLayer (input: InputLayer) {
  if (input.promisify === undefined) {
    input.promisify = input.handle.length > 2 /* req, res, next */
  }

  const handle = input.lazy
    ? lazyHandle(input.handle as LazyHandle, input.promisify)
    : (input.promisify ? promisifyHandle(input.handle) : input.handle)

  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler: toEventHandler(handle)
  }
}
