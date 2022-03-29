import { withoutTrailingSlash, withoutBase } from 'ufo'
import type { IncomingMessage, ServerResponse } from './types'

export type Handle<T = any, ReqT={}> = (req: IncomingMessage & ReqT, res: ServerResponse) => T
export type PHandle = Handle<Promise<any>>
export type Middleware = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => any) => any
export type LazyHandle = () => Handle | Promise<Handle>

export const defineHandle = <T>(handler: Handle<T>) => handler
export const defineMiddleware = (middleware: Middleware) => middleware

export function promisifyHandle (handler: Handle | Middleware): PHandle {
  return function (req: IncomingMessage, res: ServerResponse) {
    return callHandle(handler, req, res)
  }
}

export function callHandle (handler: Middleware, req: IncomingMessage, res: ServerResponse) {
  const isMiddleware = handler.length > 2
  return new Promise((resolve, reject) => {
    const next = (err?: Error) => err ? reject(err) : resolve(undefined)
    try {
      const returned = handler(req, res, next)
      if (returned !== undefined) {
        resolve(returned)
      } else if (isMiddleware) {
        res.once('close', next)
        res.once('error', next)
      } else {
        resolve(undefined)
      }
    } catch (err) {
      next(err as Error)
    }
  })
}

export function lazyHandle (handler: LazyHandle, promisify?: boolean): PHandle {
  let _promise: Promise<Handle>
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

export function useBase (base: string, handler: PHandle): PHandle {
  base = withoutTrailingSlash(base)
  if (!base) { return handler }
  return function (req, res) {
    (req as any).originalUrl = (req as any).originalUrl || req.url || '/'
    req.url = withoutBase(req.url || '/', base)
    return handler(req, res)
  }
}
