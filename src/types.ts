import type http from 'http'
import type { H3Event } from './event'

export interface IncomingMessage extends http.IncomingMessage {
  originalUrl?: string // Connect and Express
  event: H3Event,
  req: H3Event['req'],
  res: H3Event['res']
}
export interface ServerResponse extends http.ServerResponse{
  event: H3Event,
  res: H3Event['res']
  req: http.ServerResponse['req'] & {
    event: H3Event
    originalUrl?: string // Connect and Express
  }
}

export type Handler<T = any, ReqT={}> = (req: IncomingMessage & ReqT, res: ServerResponse) => T
export type PromisifiedHandler = Handler<Promise<any>>
export type Middleware = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => any) => any
export type LazyHandler = () => Handler | Promise<Handler>

// Node.js
export type Encoding = false | 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex'

// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
export type HTTPMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE'
