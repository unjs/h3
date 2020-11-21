import type { IncomingMessage, ServerResponse } from 'http'

export type Handle = (req: IncomingMessage, res: ServerResponse) => any

export type PHandle = (req: IncomingMessage, res: ServerResponse) => Promise<any>

export type Middleware = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => any) => any

export interface Layer {
  route: string
  handle: Handle
}

export type Stack = Layer[]

export type LazyHandle = () => Handle | Promise<Handle>

export interface InputLayer {
  route?: string
  handle: Handle | LazyHandle
  lazy?: boolean
  promisify?: boolean
}

export type InputStack = InputLayer[]

export interface AppUse {
  (route: string, handle: Handle, options?: Partial<InputLayer>): void
  (handle: Handle, options?: Partial<InputLayer>): void
  (options: InputLayer): void
  (route: string, handles: Handle[]): void
  (handles: Handle[]): void
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
