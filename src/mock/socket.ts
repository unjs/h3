import type * as net from 'net'
import { Callback, BufferEncoding } from '../types'
import { Writable } from './writable'
import { Readable } from './readable'
import { mergeFns } from './_utils'

type ReadableAndWritableT = Readable & Writable
type ReadableAndWritableC = new () => ReadableAndWritableT
const ReadableAndWritable: ReadableAndWritableC = class {
  constructor (readable = new Readable(), writable = new Writable()) {
    Object.assign(this, readable)
    Object.assign(this, writable)
    // @ts-ignore
    this._destroy = mergeFns(readable._destroy, writable._destroy)
  }
} as any
Object.assign(ReadableAndWritable.prototype, Readable.prototype)
Object.assign(ReadableAndWritable.prototype, Writable.prototype)

// Docs: https://nodejs.org/api/net.html#net_class_net_socket
export class Socket extends ReadableAndWritable implements net.Socket {
  readonly bufferSize: number = 0
  readonly bytesRead: number = 0
  readonly bytesWritten: number = 0
  readonly connecting: boolean = false
  readonly destroyed: boolean = false
  readonly localAddress: string = ''
  readonly localPort: number = 0
  readonly remoteAddress?: string = ''
  readonly remoteFamily?: string = ''
  readonly remotePort?: number = 0

  constructor (_options?: net.SocketConstructorOpts) {
    super()
  }

  write (_buffer: Uint8Array | string,
    _arg1?: BufferEncoding | Callback<Error | undefined>,
    _arg2?: Callback<Error | undefined>): boolean {
    return false
  }

  connect (_arg1: number | string | net.SocketConnectOpts,
    _arg2?: string | Callback, _arg3?: Callback) {
    return this
  }

  end (_arg1?: Callback | Uint8Array | string,
    _arg2?: BufferEncoding | Callback, _arg3?: Callback): void {
  }

  setEncoding (_encoding?: BufferEncoding): this {
    return this
  }

  pause () {
    return this
  }

  resume () {
    return this
  }

  setTimeout (_timeout: number, _callback?: Callback): this {
    return this
  }

  setNoDelay (_noDelay?: boolean): this {
    return this
  }

  setKeepAlive (_enable?: boolean, _initialDelay?: number): this {
    return this
  }

  address () {
    return {}
  }

  unref () {
    return this
  }

  ref () {
    return this
  }
}
