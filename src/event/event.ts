import type http from 'http'
import type {
  IncomingMessage,
  ServerResponse,
  CompatibilityEventHandler,
  EventHandler,
  H3EventContext,
  HandlerResponse,
  LazyEventHandler
} from '../types'
import { callHandler } from '../handler'
import { MIMES } from '../utils'
import { H3Response } from './response'

export function defineEventHandler <T = any> (handler: EventHandler<T>): EventHandler<T> {
  handler.__is_handler__ = true
  return handler
}
export const eventHandler = defineEventHandler

export function defineLazyEventHandler (factory: LazyEventHandler): EventHandler {
  let _promise: Promise<EventHandler>
  let _resolved: EventHandler
  const resolveHandler = () => {
    if (_resolved) { return Promise.resolve(_resolved) }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r: any) => {
        const handler = r.default || r
        if (typeof handler !== 'function') {
          throw new (TypeError as any)('Invalid lazy handler result. It should be a function:', handler)
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

export function toEventHandler (handler: CompatibilityEventHandler): EventHandler {
  if (isEventHandler(handler)) {
    return handler
  }
  if (typeof handler !== 'function') {
    throw new (TypeError as any)('Invalid handler. It should be a function:', handler)
  }
  return eventHandler((event) => {
    return callHandler(handler, event.req as IncomingMessage, event.res) as HandlerResponse
  })
}

export function createEvent (req: http.IncomingMessage, res: http.ServerResponse): H3Event {
  return new H3Event(req, res)
}

type PartialFetchEvent = Pick<FetchEvent, 'respondWith'>

export class H3Event implements PartialFetchEvent {
  '__is_event__' = true
  req: IncomingMessage
  res: ServerResponse
  event: H3Event
  context: H3EventContext = {}

  constructor (req: http.IncomingMessage | IncomingMessage, res: http.ServerResponse | ServerResponse) {
    this.req = req as IncomingMessage
    this.res = res as ServerResponse

    // Backward comatibility for interchangable usage of {event,req,res}.{req,res}
    // TODO: Remove in future versions
    this.event = this
    // @ts-ignore
    req.event = this
    // @ts-ignore
    req.context = this.context
    // @ts-ignore
    req.req = req
    // @ts-ignore
    req.res = res
    // @ts-ignore
    res.event = this
    // @ts-ignore
    res.res = res
    // @ts-ignore
    res.req = res.req || {}
    // @ts-ignore
    res.req.res = res
    // @ts-ignore
    res.req.req = req
  }

  // Implementation of FetchEvent
  respondWith (r: H3Response | PromiseLike<H3Response>): void {
    Promise.resolve(r).then((_response) => {
      if (this.res.writableEnded) { return }

      const response = _response instanceof H3Response ? _response : new H3Response(_response)

      response.headers.forEach((value, key) => {
        this.res.setHeader(key, value)
      })
      if (response.status) {
        this.res.statusCode = response.status
      }
      if (response.statusText) {
        this.res.statusMessage = response.statusText
      }
      if (response.redirected) {
        this.res.setHeader('Location', response.url)
      }
      if (!response._body) {
        return this.res.end()
      }
      if (typeof response._body === 'string' || 'buffer' in response._body || 'byteLength' in response._body) {
        return this.res.end(response._body)
      }
      if (!response.headers.has('content-type')) {
        response.headers.set('content-type', MIMES.json)
      }
      this.res.end(JSON.stringify(response._body))
    })
  }
}

export function isEvent (input: any): input is H3Event {
  return '__is_event__' in input
}
