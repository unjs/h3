import { withoutTrailingSlash, withoutBase } from 'ufo'
import type { IncomingMessage, ServerResponse } from './types/node'

export type Handle<T = any> = (req: IncomingMessage, res: ServerResponse) => T
export type PHandle = Handle<Promise<any>>
export type Middleware = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => any) => any
export type LazyHandle = () => Handle | Promise<Handle>

export const defineHandle = <T>(handler: Handle<T>) => handler
export const defineMiddleware = (middleware: Middleware) => middleware

export function promisifyHandle (handle: Handle | Middleware): PHandle {
  return function (req: IncomingMessage, res: ServerResponse) {
    return callHandle(handle, req, res)
  }
}

export function callHandle (handle: Middleware, req: IncomingMessage, res: ServerResponse) {
  return new Promise((resolve, reject) => {
    const next = (err?: Error) => err ? reject(err) : resolve(undefined)
    try {
      const returned = handle(req, res, next)
      if (returned !== undefined) {
        resolve(returned)
      } else {
        res.once('close', next)
        res.once('error', next)
      }
    } catch (err) {
      next(err)
    }
  })
}

export function lazyHandle (handle: LazyHandle, promisify?: boolean): PHandle {
  let _promise: Promise<Handle>
  const resolve = () => {
    if (!_promise) {
      _promise = Promise.resolve(handle())
        .then((r: any) => promisify ? promisifyHandle(r.default || r) : (r.default || r))
    }
    return _promise
  }
  return function (req: IncomingMessage, res: ServerResponse) {
    return resolve().then(h => h(req, res))
  }
}

export function useBase (base: string, handle: PHandle): PHandle {
  base = withoutTrailingSlash(base)
  if (!base) { return handle }
  return function (req, res) {
    (req as any).originalUrl = (req as any).originalUrl || req.url || '/'
    req.url = withoutBase(req.url || '/', base)
    return handle(req, res)
  }
}
