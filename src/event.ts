import type http from 'http'
import type { IncomingMessage, ServerResponse, Handler, Middleware } from './types'
import { callHandler } from './handler'
import { MIMES } from './utils'

export interface H3EventContext extends Record<string, any> {}

export type CompatibilityEvent = H3Event | IncomingMessage

export type HandlerResponse<T = any> = T | Promise<T>

export interface EventHandler<T = any> {
  '__is_handler__'?: true
  (event: H3Event): HandlerResponse<T>
}

export function defineEventHandler <T = any> (handler: EventHandler<T>): EventHandler<T> {
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

export type CompatibilityEventHandler = EventHandler | Handler | Middleware

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

export class H3Event {
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
  respondWith <T> (r: HandlerResponse<T> | H3Response | Promise<H3Response>): void {
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
        return this.res.end()
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
      this.res.end(JSON.stringify(response._body, null, 2))
    })
  }
}

export function isEvent (input: any): input is H3Event {
  return '__is_event__' in input
}

export class H3Headers implements Headers {
  _headers: Record<string, string>

  constructor (init?: HeadersInit) {
    if (!init) {
      this._headers = {}
    } else if (Array.isArray(init)) {
      this._headers = Object.fromEntries(init.map(([key, value]) => [key.toLowerCase(), value]))
    } else if (init && 'append' in init) {
      this._headers = Object.fromEntries([...(init as any).entries()])
    } else {
      this._headers = Object.fromEntries(Object.entries(init).map(([key, value]) => [key.toLowerCase(), value]))
    }
  }

  append (name: string, value: string): void {
    const _name = name.toLowerCase()
    this.set(_name, [this.get(_name), value].filter(Boolean).join(', '))
  }

  delete (name: string): void {
    delete this._headers[name.toLowerCase()]
  }

  get (name: string): string | null {
    return this._headers[name.toLowerCase()]
  }

  has (name: string): boolean {
    return name.toLowerCase() in this._headers
  }

  set (name: string, value: string): void {
    this._headers[name.toLowerCase()] = String(value)
  }

  forEach (callbackfn: (value: string, key: string, parent: Headers) => void): void {
    Object.entries(this._headers).forEach(([key, value]) => callbackfn(value, key, this))
  }
}

/**
 * This is a minimal clone of Response
 */
export class H3Response implements Response {
  readonly headers: Headers
  readonly status: number
  readonly statusText: string
  readonly redirected: boolean
  readonly ok: boolean
  readonly url: string
  _body: string | ArrayBuffer | Uint8Array

  // TODO: yet to implement
  readonly body: ReadableStream<Uint8Array> | null = null
  readonly type: ResponseType = 'default'
  readonly bodyUsed = false

  constructor (body: BodyInit | HandlerResponse | null = null, init: ResponseInit = {}) {
    this.headers = new H3Headers(init.headers)
    this.status = init.status ?? 200
    this.statusText = init.statusText || ''
    this.redirected = !!init.status && [301, 302, 307, 308].includes(init.status)
    this._body = body
    this.url = ''
    this.ok = this.status < 300 && this.status > 199
  }

  clone (): H3Response {
    return new H3Response(this.body, {
      headers: this.headers,
      status: this.status,
      statusText: this.statusText
    })
  }

  arrayBuffer (): Promise<ArrayBuffer> {
    return Promise.resolve(this._body as unknown as ArrayBuffer)
  }

  blob (): Promise<Blob> {
    return Promise.resolve(this._body as unknown as Blob)
  }

  formData (): Promise<FormData> {
    return Promise.resolve(this._body as unknown as FormData)
  }

  json <T = any> (): Promise<T> {
    return Promise.resolve(this._body as unknown as T)
  }

  text (): Promise<string> {
    return Promise.resolve(this._body as unknown as string)
  }
}
