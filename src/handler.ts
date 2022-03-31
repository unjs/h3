import { withoutTrailingSlash, withoutBase } from 'ufo'
import type { Handler, PromisifiedHandler, Middleware, IncomingMessage, ServerResponse, LazyHandler } from './types'

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
  return new Promise((resolve, reject) => {
    const next = (err?: Error) => err ? reject(err) : resolve(undefined)
    try {
      return resolve(handler(req, res, next))
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
  return function (req, res) {
    (req as any).originalUrl = (req as any).originalUrl || req.url || '/'
    req.url = withoutBase(req.url || '/', base)
    return handler(req, res)
  }
}
