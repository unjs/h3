import type { IncomingMessage, IncomingHttpHeaders } from 'http'
import { Socket } from './socket'
import { Readable } from './readable'
import { rawHeaders } from './_utils'

// Docs: https://nodejs.org/api/http.html#http_class_http_incomingmessage
// Implementation: https://github.com/nodejs/node/blob/master/lib/_http_incoming.js

export class Request extends Readable implements IncomingMessage {
  public aborted: boolean = false;
  public httpVersion: string = '1.1'
  public httpVersionMajor: number = 1
  public httpVersionMinor: number = 1
  public complete: boolean = true
  public connection: Socket
  public socket: Socket
  public headers: IncomingHttpHeaders = {}
  public trailers = {}
  public method: string = 'GET'
  public url: string = '/'
  public statusCode: number = 200
  public statusMessage: string = ''

  readable: boolean = false

  constructor (socket?: Socket) {
    super()
    this.socket = this.connection = socket || new Socket()
  }

  get rawHeaders () {
    return rawHeaders(this.headers)
  }

  get rawTrailers () {
    return []
  }

  setTimeout (_msecs: number, _callback?: () => void) {
    return this
  }
}

export function createRequest (ctx: any) {
  const req = new Request()
  req.url = ctx.url || '/'
  req.method = ctx.method || 'GET'
  req.headers = ctx.headers || {}
  req.headers.host = req.headers.host || req.headers.Host || ctx.host || null
  // @ts-ignore encrypted is a tls-socket property
  req.connection.encrypted = req.connection.encrypted || ctx.protocol === 'https'
}
