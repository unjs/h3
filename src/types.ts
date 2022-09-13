import type { IncomingMessage as NodeIncomingMessage, ServerResponse as NodeServerResponse } from 'http'
import type { H3Event } from './event'

// Node.js
export type { IncomingMessage as NodeIncomingMessage, ServerResponse as NodeServerResponse } from 'http'
export type NodeHandler = (req: NodeIncomingMessage, res: NodeServerResponse) => void
export type PromisifiedNodeHandler = (req: NodeIncomingMessage, res: NodeServerResponse) => Promise<void>
export type NodeMiddleware = (req: NodeIncomingMessage, res: NodeServerResponse, next: (err?: Error) => any) => any
export type Encoding = false | 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex'

// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
export type HTTPMethod = 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE'

export interface H3EventContext extends Record<string, any> {}

export type HandlerResponse<T = any> = T | Promise<T>

export interface EventHandler<T = any> {
  '__is_handler__'?: true
  (event: H3Event): HandlerResponse<T>
}

export type LazyEventHandler = () => EventHandler | Promise<EventHandler>
