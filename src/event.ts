import type http from 'http'
import type { IncomingMessage, ServerResponse, Handler, Middleware } from './types'
import { callHandler } from './handler'

export interface H3Event {
  '__is_event__': true
  event: H3Event
  req: IncomingMessage
  res: ServerResponse
  /**
   * Request params only filled with h3 Router handlers
   */
  params?: Record<string, any>
}

export type CompatibilityEvent = H3Event | IncomingMessage | ServerResponse

export type _JSONValue<T=string|number|boolean> = T | T[] | Record<string, T>
export type JSONValue = _JSONValue<_JSONValue>
export type H3Response = void | JSONValue | Buffer

export interface EventHandler {
  '__is_handler__'?: true
  (event: CompatibilityEvent): H3Response| Promise<H3Response>
}

export function defineEventHandler (handler: EventHandler) {
  handler.__is_handler__ = true
  return handler
}

export type LazyEventHandler = () => EventHandler | Promise<EventHandler>
export function defineLazyEventHandler (factory: LazyEventHandler): EventHandler {
  let _promise: Promise<EventHandler>
  let _resolved: EventHandler
  const resolveHandler = () => {
    if (_resolved) { return Promise.resolve(_resolved) }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r: any) => {
        const handler = r.default || r
        if (typeof handler !== 'function') {
          throw new TypeError('Invalid lazy handler result. It should be a function:', handler)
        }
        _resolved = toEventHandler(r.default || r)
        return _resolved
      })
    }
    return _promise
  }
  return defineEventHandler((event) => {
    if (_resolved) {
      return _resolved(event)
    }
    return resolveHandler().then(handler => handler(event))
  })
}

export function isEventHandler (input: any): input is EventHandler {
  return '__is_handler__' in input
}

export type CompatibilityEventHandler = EventHandler | Handler | Middleware

export function toEventHandler (handler: CompatibilityEventHandler): EventHandler {
  if (isEventHandler(handler)) {
    return handler
  }
  if (typeof handler !== 'function') {
    throw new TypeError('Invalid handler. It should be a function:', handler)
  }
  return defineEventHandler((event) => {
    return callHandler(handler, event.req as IncomingMessage, event.res) as Promise<H3Response>
  })
}

export function createEvent (req: http.IncomingMessage, res: http.ServerResponse): CompatibilityEvent {
  const event = {
    __is_event__: true,
    req,
    res
  } as H3Event

  // Backward comatibility for interchangable usage of {event,req,res}.{req,res}
  // TODO: Remove in future versions
  // @ts-ignore
  event.event = event
  // @ts-ignore
  req.event = event
  // @ts-ignore
  req.req = req
  // @ts-ignore
  req.res = res
  // @ts-ignore
  res.event = event
  // @ts-ignore
  res.res = res
  // @ts-ignore
  res.req = res.req || {}
  // @ts-ignore
  res.req.res = res
  // @ts-ignore
  res.req.req = req

  return event
}

export function isEvent (input: any): input is H3Event {
  return '__is_event__' in input
}
