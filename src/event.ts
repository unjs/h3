import type http from 'http'
import type { IncomingMessage, ServerResponse, Handler, Middleware } from './types'
import { callHandler } from './handler'

export interface H3Event {
  '__is_event__': true
  event: H3Event
  req: IncomingMessage
  res: ServerResponse
  context: Record<string, any>
}

export type CompatibilityEvent = H3Event | IncomingMessage

interface JSONObject { [x: string]: JSONValue }
interface JSONArray extends Array<JSONValue> { }
export type JSONValue =
  | string
  | number
  | boolean
  | JSONObject
  | JSONArray

type _H3Response = void | JSONValue | Buffer
export type H3Response = _H3Response | Promise<_H3Response>

export interface EventHandler<T extends H3Response = H3Response> {
  '__is_handler__'?: true
  (event: CompatibilityEvent): T
}

export function defineEventHandler <T extends H3Response = H3Response> (handler: EventHandler<T>): EventHandler<T> {
  handler.__is_handler__ = true
  return handler
}
export const eventHandler = defineEventHandler

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
  return eventHandler((event) => {
    if (_resolved) {
      return _resolved(event)
    }
    return resolveHandler().then(handler => handler(event))
  })
}
export const lazyEventHandler = defineLazyEventHandler

export interface DynamicEventHandler extends EventHandler {
  set: (handler: EventHandler) => void
}
export function dynamicEventHandler (initial?: EventHandler): DynamicEventHandler {
  let current: EventHandler | undefined = initial
  const wrapper = eventHandler((event) => {
    if (current) {
      return current(event)
    }
  }) as DynamicEventHandler
  wrapper.set = (handler) => { current = handler }
  return wrapper
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
  return eventHandler((event) => {
    return callHandler(handler, event.req as IncomingMessage, event.res) as H3Response
  })
}

export function createEvent (req: http.IncomingMessage, res: http.ServerResponse): CompatibilityEvent {
  const event = {
    __is_event__: true,
    req,
    res,
    context: {}
  } as H3Event

  // Backward comatibility for interchangable usage of {event,req,res}.{req,res}
  // TODO: Remove in future versions
  // @ts-ignore
  event.event = event
  // @ts-ignore
  req.event = event
  // @ts-ignore
  req.context = event.context
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
