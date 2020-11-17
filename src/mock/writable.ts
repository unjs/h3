import { EventEmitter } from 'events'
import type * as stream from 'stream'
import type { BufferEncoding, Callback } from '../types'

// Docs: https://nodejs.org/api/stream.html#stream_writable_streams
// Implementation: https://github.com/nodejs/node/blob/master/lib/internal/streams/writable.js

export class Writable extends EventEmitter implements stream.Writable {
  readonly writable: boolean = true
  readonly writableEnded: boolean =false
  readonly writableFinished: boolean = false
  readonly writableHighWaterMark: number = 0
  readonly writableLength: number = 0
  readonly writableObjectMode: boolean = false
  readonly writableCorked: number = 0

  destroyed: boolean = false

  _data: any
  _encoding: BufferEncoding = 'utf-8'

  constructor (_opts?: stream.WritableOptions) {
    super()
  }

  pipe<T> (_destenition: T, _options?: { end?: boolean }): T {
    return {} as T
  }

  _write (chunk: any, encoding: BufferEncoding, callback?: Callback): void {
    this._data = chunk // TODO: append
    this._encoding = encoding
    if (callback) {
      callback()
    }
  }

  _writev? (_chunks: Array<{ chunk: any, encoding: BufferEncoding }>, _callback: (error?: Error | null) => void): void {
  }

  _destroy (_error: any, _callback: Callback<any>): void {
  }

  _final (_callback: Callback) {
  }

  write (chunk: any, arg2?: BufferEncoding | Callback, arg3?: Callback): boolean {
    const encoding = typeof arg2 === 'string' ? this._encoding : 'utf-8'
    const cb = typeof arg2 === 'function' ? arg2 : (typeof arg3 === 'function' ? arg3 : undefined)
    this._write(chunk, encoding, cb)
    return true
  }

  setDefaultEncoding (_encoding: BufferEncoding): this {
    return this
  }

  end (arg1: Callback | any, arg2?: Callback | BufferEncoding, arg3?: Callback): void {
    const cb = (typeof arg1 === 'function') ? arg1 : (typeof arg2 === 'function' ? arg2 : (typeof arg3 === 'function' ? arg3 : undefined))
    const data = arg1 !== cb ? arg1 : undefined
    if (data) {
      const encoding = arg2 !== cb ? arg2 : undefined
      this.write(data, encoding, cb)
    }
    // TODO: end
  }

  cork (): void {
  }

  uncork (): void {
  }

  destroy (_error?: Error): void {
  }
}
