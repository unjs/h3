import type { IncomingMessage as NodeIncomingMessage, ServerResponse as NodeServerResponse } from 'http'
import { createError } from './error'
import { eventHandler, isEventHandler } from './event'
import { EventHandler } from './types'

// Node.js
export type { IncomingMessage as NodeIncomingMessage, ServerResponse as NodeServerResponse } from 'http'
export type NodeHandler = (req: NodeIncomingMessage, res: NodeServerResponse) => void
export type PromisifiedNodeHandler = (req: NodeIncomingMessage, res: NodeServerResponse) => Promise<void>
export type NodeMiddleware = (req: NodeIncomingMessage, res: NodeServerResponse, next: (err?: Error) => any) => any
export type Encoding = false | 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex'

export const defineNodeHandler = (handler: NodeHandler) => handler

export const defineNodeMiddleware = (middleware: NodeMiddleware) => middleware

export function nodeEventHandler (handler: NodeHandler | NodeMiddleware): EventHandler {
  if (isEventHandler(handler)) {
    return handler
  }
  if (typeof handler !== 'function') {
    throw new (TypeError as any)('Invalid handler. It should be a function:', handler)
  }
  return eventHandler((event) => {
    return callNodeHandler(handler, event.req as NodeIncomingMessage, event.res) as HandlerResponse
  })
}

export function promisifyNodeHandler (handler: NodeHandler | NodeMiddleware): PromisifiedNodeHandler {
  return function (req: NodeIncomingMessage, res: NodeServerResponse) {
    return callNodeHandler(handler, req, res)
  }
}

export function callNodeHandler (handler: NodeMiddleware, req: NodeIncomingMessage, res: NodeServerResponse) {
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

export function defineLazyNodeHandler (handler: LazyEventHandler, promisify?: boolean): EventHandler {
  let _promise: Promise<EventHandler>
  const resolve = () => {
    if (!_promise) {
      _promise = Promise.resolve(handler())
        .then((r: any) => promisify ? promisifyNodeHandler(r.default || r) : (r.default || r))
    }
    return _promise
  }
  return function (req: NodeIncomingMessage, res: NodeServerResponse) {
    return resolve().then(h => h(req, res))
  }
}
