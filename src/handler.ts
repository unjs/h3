import { withoutTrailingSlash, withoutBase } from 'ufo'
import { createError } from './error'
import { eventHandler } from './event'
import type { EventHandler, PromisifiedNodeHandler, NodeHandler, NodeIncomingMessage, NodeServerResponse, LazyEventHandler } from './types'

export const defineHandler = <T>(handler: Handler<T>) => handler

/** @deprecated Use defineHandler */
export const defineHandle = defineHandler

export const defineMiddleware = (middleware: Middleware) => middleware

export function promisifyHandler (handler: Handler | Middleware): PromisifiedHandler {
  return function (req: IncomingMessage, res: ServerResponse) {
    return callHandler(handler, req, res)
  }
}

/** @deprecated Use defineHandler */
export const promisifyHandle = promisifyHandler

export function callHandler (handler: Middleware, req: IncomingMessage, res: ServerResponse) {
  const isMiddleware = handler.length > 2
  return new Promise((resolve, reject) => {
    const next = (err?: Error) => {
      if (isMiddleware) {
        res.off('close', next)
        res.off('error', next)
      }
      return err ? reject(createError(err)) : resolve(undefined)
    }
    try {
      const returned = handler(req, res, next)
      if (isMiddleware && returned === undefined) {
        res.once('close', next)
        res.once('error', next)
      } else {
        resolve(returned)
      }
    } catch (err) {
      next(err as Error)
    }
  })
}

export function defineLazyHandler (handler: LazyHandler, promisify?: boolean): Handler {
  let _promise: Promise<Handler>
  const resolve = () => {
    if (!_promise) {
      _promise = Promise.resolve(handler())
        .then((r: any) => promisify ? promisifyHandler(r.default || r) : (r.default || r))
    }
    return _promise
  }
  return function (req: IncomingMessage, res: ServerResponse) {
    return resolve().then(h => h(req, res))
  }
}

/** @deprecated Use defineLazyHandler */
export const lazyHandle = defineLazyHandler

export function useBase (base: string, handler: Handler): Handler {
  base = withoutTrailingSlash(base)
  if (!base) { return handler }
  return eventHandler(event => {
    (event.req as any).originalUrl = (event.req as any).originalUrl || event.req.url || '/'
    event.req.url = withoutBase(event.req.url || '/', base)
    return handler(event)
  })
}
