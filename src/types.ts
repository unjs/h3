import type { IncomingMessage, ServerResponse } from 'http'

export interface RequestT extends IncomingMessage { }

export interface ResponseT extends ServerResponse { }

export type NextFn = (err?: Error) => any

export type Handle = (req: RequestT, res: ResponseT, next?: NextFn) => any

export type PHandle = (req: RequestT, res: ResponseT, next?: NextFn) => Promise<any>

export interface Layer {
  route: string
  handle: PHandle
}

export type Stack = Layer[]
export interface InputLayer { route: string, handle: Handle }
export type InputStack = InputLayer[]

export type LazyHandle = () => Handle | Promise<Handle>

export interface App {
  stack: Stack
  handle: Handle
  use: (route: string, handle: Handle) => void
}

export type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le'
  | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex'

export type Callback<E = Error | null | undefined> = (error?: E) => void

export type Headers = { [key: string]: string | string[] | undefined }

export interface RequestOptions {
  url: string,
  method: string
  host: string
  protocol: 'http' | 'https' | string
  headers: Headers
  [key: string]: any
}
