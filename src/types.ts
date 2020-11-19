import type { IncomingMessage, ServerResponse } from 'http'

export type Handle = (req: IncomingMessage, res: ServerResponse) => any

export type Middleware = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => any) => any

export interface Layer {
  route: string
  handle: Handle
}

export type Stack = Layer[]
export interface InputLayer { route: string, handle: Handle }
export type InputStack = InputLayer[]

export type LazyHandle = () => Handle | Promise<Handle>

export interface App {
  stack: Stack
  handle: Handle
  unsafeHandle: Handle
  use: (route: string, handle: Handle) => void
}
