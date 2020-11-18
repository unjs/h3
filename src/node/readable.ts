import { EventEmitter } from 'events'
import type * as stream from 'stream'
import type { BufferEncoding, Callback } from '../types'

// Docs: https://nodejs.org/api/stream.html#stream_readable_streams
// Implementation: https://github.com/nodejs/node/blob/master/lib/internal/streams/readable.js

export class Readable extends EventEmitter implements stream.Readable {
  readonly readableEncoding: BufferEncoding | null = null
  readonly readableEnded: boolean = true
  readonly readableFlowing: boolean | null = false
  readonly readableHighWaterMark: number = 0
  readonly readableLength: number = 0
  readonly readableObjectMode: boolean = false

  readable: boolean = false
  destroyed: boolean = false

  static from (_iterable: Iterable<any> | AsyncIterable<any>, options?: stream.ReadableOptions) {
    return new Readable(options)
  }

  constructor (_opts?: stream.ReadableOptions) {
    super()
  }

  _read (_size: number) {
  }

  read (_size?: number) {
  }

  setEncoding (_encoding: BufferEncoding) {
    return this
  }

  pause () {
    return this
  }

  resume () {
    return this
  }

  isPaused () {
    return true
  }

  unpipe (_destination?: any) {
    return this
  }

  unshift (_chunk: any, _encoding?: BufferEncoding) {
  }

  wrap (_oldStream: any) {
    return this
  }

  push (_chunk: any, _encoding?: BufferEncoding) {
    return false
  }

  _destroy (_error?: any, _callback?: Callback<any>) {
  }

  destroy (error?: Error) {
    return this._destroy(error)
  }

  pipe<T> (_destenition: T, _options?: { end?: boolean }): T {
    return {} as T
  }

  async *[Symbol.asyncIterator] (): AsyncIterableIterator<any> {
  }
}
