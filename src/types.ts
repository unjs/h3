import type { IncomingMessage, ServerResponse } from 'http'

export type Handle = (req: IncomingMessage, res: ServerResponse) => any

export type PHandle = (req: IncomingMessage, res: ServerResponse) => Promise<any>

export type Middleware = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => any) => any

export type Matcher = (url: string, req?: IncomingMessage) => boolean

export interface Layer {
  route: string
  match?: Matcher
  handle: Handle
}

export type Stack = Layer[]

export type LazyHandle = () => Handle | Promise<Handle>

export interface InputLayer {
  route?: string
  match?: Matcher
  handle: Handle | LazyHandle
  lazy?: boolean
  promisify?: boolean
}

export type InputStack = InputLayer[]

export interface AppUse {
  (route: string, handle: Handle, options?: Partial<InputLayer>): App
  (handle: Handle, options?: Partial<InputLayer>): App
  (options: InputLayer): App
  (route: string, handles: Handle[]): App
  (handles: Handle[]): App
}

export interface App {
  (req: IncomingMessage, res: ServerResponse): Promise<any>
  stack: Stack
  handle: PHandle
  use: AppUse
  useAsync: AppUse
}

export interface AppOptions {
  debug?: boolean
}
