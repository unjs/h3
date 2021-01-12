import { withoutTrailingSlash } from 'ufo'
import type { IncomingMessage, ServerResponse } from './types/node'

export type Handle = (req: IncomingMessage, res: ServerResponse) => any
export type PHandle = (req: IncomingMessage, res: ServerResponse) => Promise<any>
export type Middleware = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => any) => any
export type LazyHandle = () => Handle | Promise<Handle>

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

export function lazyHandle (handle: LazyHandle, promisify: boolean = true): PHandle {
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
    req.url = req.url || ''
    if (req.url.startsWith(base)) {
      req.url = req.url.substr(base.length) || '/'
    }
    return handle(req, res)
  }
}
