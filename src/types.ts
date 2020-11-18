import type { IncomingMessage, ServerResponse } from 'http'

export type NextFn = (err?: Error) => any

export type Handle = (req: IncomingMessage, res: ServerResponse, next?: NextFn) => any

export type PHandle = (req: IncomingMessage, res: ServerResponse, next?: NextFn) => Promise<any>

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

export type HeadersObject = { [key: string]: string | string[] | undefined }

export interface CallContext {
  url?: string
  method?: string
  headers?: HeadersObject
  host?: string
  protocol?: 'http' | 'https' | string

  req?: IncomingMessage
  res?: ServerResponse

  [key: string]: any
}
