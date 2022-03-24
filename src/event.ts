import type { IncomingMessage, ServerResponse } from './types/node'
import type { Handle, Middleware } from './handle'

export interface H3Event {
  req: IncomingMessage
  res: ServerResponse,
  next?: (err?: Error) => void
}

export type _JSONValue<T=string|number|boolean> = T | T[] | Record<string, T>
export type JSONValue = _JSONValue<_JSONValue>
export type H3Response = void | JSONValue | Buffer

export interface H3EventHandler {
  __is_handler__?: true
  (event: H3Event): H3Response| Promise<H3Response>
}

export function defineEventHandler (handler: H3EventHandler) {
  handler.__is_handler__ = true
  return handler
}

export function isEventHandler (handler: H3EventHandler | Handle | Middleware): handler is H3EventHandler {
  return '__is_handler__' in handler
}

export function toEventHandler (handler: H3EventHandler | Handle | Middleware): H3EventHandler {
  if (isEventHandler(handler)) {
    return handler
  }
  if (handler.length > 2) {
    return defineEventHandler((event) => {
      return (handler as Middleware)(event.req, event.res, event.next!)
    })
  } else {
    return defineEventHandler((event) => {
      return (handler as Handle)(event.req, event.res)
    })
  }
}

export function createEvent (req: IncomingMessage, res: ServerResponse): H3Event {
  return {
    req,
    res
  }
}
