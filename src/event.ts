import type http from 'http'
import type { IncomingMessage, ServerResponse } from './types/node'
import type { Handle, Middleware } from './handle'

export interface H3Event {
  '__is_event__': true
  req: IncomingMessage
  res: ServerResponse,
  next?: (err?: Error) => void
}

export type H3CompatibilityEvent = H3Event | IncomingMessage | ServerResponse

export type _JSONValue<T=string|number|boolean> = T | T[] | Record<string, T>
export type JSONValue = _JSONValue<_JSONValue>
export type H3Response = void | JSONValue | Buffer

export interface H3EventHandler {
  '__is_handler__'?: true
  (event: H3CompatibilityEvent): H3Response| Promise<H3Response>
}

export function defineEventHandler (handler: H3EventHandler) {
  handler.__is_handler__ = true
  return handler
}

export function isEventHandler (input: any): input is H3EventHandler {
  return '__is_handler__' in input
}

export function toEventHandler (handler: H3EventHandler | Handle | Middleware): H3EventHandler {
  if (isEventHandler(handler)) {
    return handler
  }
  if (handler.length > 2) {
    return defineEventHandler((event) => {
      return (handler as Middleware)(event.req as IncomingMessage, event.res, event.next!)
    })
  } else {
    return defineEventHandler((event) => {
      return (handler as Handle)(event.req as IncomingMessage, event.res)
    })
  }
}

export function createEvent (req: http.IncomingMessage, res: http.ServerResponse): H3CompatibilityEvent {
  const event = {
    __is_event__: true,
    req,
    res
  } as H3Event

  // Add backward comatibility for interchangable usage of {event,req,res}.{event,req,res}
  event.event = event

  req.event = event
  req.req = req
  req.res = res

  res.event = event
  // res.req = req
  res.res = res

  return event
}

export function isEvent (input: any): input is H3Event {
  return '__is_event__' in input
}
