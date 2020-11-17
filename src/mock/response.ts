import type { OutgoingHttpHeader, OutgoingHttpHeaders, IncomingMessage, ServerResponse } from 'http'
import type { Socket } from 'net'
import { Callback, Headers } from '../types'
import { Writable } from './writable'

// Docs: https://nodejs.org/api/http.html#http_class_http_serverresponse
// Implementation: https://github.com/nodejs/node/blob/master/lib/_http_outgoing.js

export class Response extends Writable implements ServerResponse {
  statusCode: number = 200;
  statusMessage: string = '';
  upgrading: boolean = false;
  chunkedEncoding: boolean = false;
  shouldKeepAlive: boolean = false;
  useChunkedEncodingByDefault: boolean = false;
  sendDate: boolean = false;
  finished: boolean = false;
  headersSent: boolean = false;
  connection: Socket | null = null;
  socket: Socket | null = null;
  req: IncomingMessage

  _headers: Headers = {}

  constructor (req: IncomingMessage) {
    super()
    this.req = req
  }

  _consume () {
    return {
      statusCode: this.statusCode,
      statusMessage: this.statusMessage,
      headers: this._headers,
      data: this._data,
      encoding: this._encoding
    }
  }

  assignSocket (socket: Socket): void {
    // @ts-ignore
    socket._httpMessage = this
    // socket.on('close', onServerResponseClose)
    this.socket = socket
    this.connection = socket
    this.emit('socket', socket)
    this._flush()
  }

  _flush () {
    this.flushHeaders()
  }

  detachSocket (_socket: Socket): void {
  }

  writeContinue (_callback?: Callback): void {
  }

  writeHead (statusCode: number,
    arg1?: string | OutgoingHttpHeaders | OutgoingHttpHeader[],
    arg2?: OutgoingHttpHeaders | OutgoingHttpHeader[]) {
    if (statusCode) {
      this.statusCode = statusCode
    }
    if (typeof arg1 === 'string') {
      this.statusMessage = arg1
      arg1 = undefined
    }
    const headers = arg2 || arg1
    if (headers) {
      if (Array.isArray(headers)) {
        // TODO: OutgoingHttpHeader[]
      } else {
        for (const key in headers) {
          // @ts-ignore
          this.setHeader(key, headers[key])
        }
      }
    }
    this.headersSent = true
    return this
  }

  writeProcessing (): void {
  }

  setTimeout (_msecs: number, _callback?: Callback): this {
    return this
  }

  setHeader (name: string, value: number | string | ReadonlyArray<string>): void {
    this._headers[name.toLowerCase()] = value + ''
  }

  getHeader (name: string): number | string | string[] | undefined {
    return this._headers[name.toLowerCase()]
  }

  getHeaders (): OutgoingHttpHeaders {
    return this._headers
  }

  getHeaderNames (): string[] {
    return Object.keys(this._headers)
  }

  hasHeader (name: string): boolean {
    return name.toLowerCase() in this._headers
  }

  removeHeader (name: string): void {
    delete this._headers[name.toLowerCase()]
  }

  addTrailers (_headers: OutgoingHttpHeaders | ReadonlyArray<[string, string]>): void {
  }

  flushHeaders (): void {
  }
}
