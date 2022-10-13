import type { H3Event } from './event'

// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
export type HTTPMethod = 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE'

export interface H3EventContext extends Record<string, any> {}

export type EventHandlerResponse<T = any> = T | Promise<T>

export interface EventHandler<T = any> {
  '__is_handler__'?: true
  (event: H3Event): EventHandlerResponse<T>
}

export type LazyEventHandler = () => EventHandler | Promise<EventHandler>
