import type { IncomingMessage as NodeIncomingMessage, ServerResponse as NodeServerResponse } from 'http'
import type { IncomingMessage, ServerResponse, H3EventContext, CompatibilityEvent } from '../types'
import { MIMES } from '../utils'
import { H3Response } from './response'

export class H3Event implements Pick<FetchEvent, 'respondWith'> {
  '__is_event__' = true
  req: IncomingMessage
  res: ServerResponse
  event: H3Event
  context: H3EventContext = {}

  constructor (req: NodeIncomingMessage | IncomingMessage, res: NodeServerResponse | ServerResponse) {
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

export function createEvent (req: NodeIncomingMessage, res: NodeServerResponse): H3Event {
  return new H3Event(req, res)
}

export function writeEarlyHints (event: CompatibilityEvent, links: string | string[], callback?: () => void) {
  if (!event.res.socket && !('writeEarlyHints' in event.res)) { return }

  if ('writeEarlyHints' in event.res) {
    // @ts-expect-error native node 18 implementation
    return event.res.writeEarlyHints(links, callback)
  }

  const _links = Array.isArray(links) ? links : [links]
  event.res.socket!.write(`HTTP/1.1 103 Early Hints\r\nLink: ${_links.join('\r\n')}\r\n\r\n`, 'utf-8', callback)
}
