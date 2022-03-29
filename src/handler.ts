import { withoutTrailingSlash, withoutBase } from 'ufo'
import type { Handler, PromisifiedHandler, Middleware, IncomingMessage, ServerResponse, LazyHandler } from './types'

export const defineHandle = <T>(handler: Handler<T>) => handler
export const defineMiddleware = (middleware: Middleware) => middleware

export function promisifyHandle (handler: Handler | Middleware, allowAsync = true): PromisifiedHandler {
  return function (req: IncomingMessage, res: ServerResponse) {
    return callHandle(handler, req, res, allowAsync)
  }
}

export function callHandle (handler: Middleware, req: IncomingMessage, res: ServerResponse, allowAsync?: boolean) {
  return new Promise((resolve, reject) => {
    const next = (err?: Error) => err ? reject(err) : resolve(undefined)
    try {
      const returned = handler(req, res, next)
      if (returned !== undefined || !allowAsync) {
        return resolve(returned)
      }
      res.once('close', next)
      res.once('error', next)
    } catch (err) {
      next(err as Error)
    }
  })
}

export function lazyHandler (handler: LazyHandler, promisify?: boolean): PromisifiedHandler {
  let _promise: Promise<Handler>
  const resolve = () => {
    if (!_promise) {
      _promise = Promise.resolve(handler())
        .then((r: any) => promisify ? promisifyHandle(r.default || r) : (r.default || r))
    }
    return _promise
  }
  return function (req: IncomingMessage, res: ServerResponse) {
    return resolve().then(h => h(req, res))
  }
}
export const lazyHandle = lazyHandler // Backward compat

export function useBase (base: string, handler: PromisifiedHandler): PromisifiedHandler {
  base = withoutTrailingSlash(base)
  if (!base) { return handler }
  return function (req, res) {
    (req as any).originalUrl = (req as any).originalUrl || req.url || '/'
    req.url = withoutBase(req.url || '/', base)
    return handler(req, res)
  }
}
