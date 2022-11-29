import { Readable } from "node:stream";
import type { H3Event } from "./event";

// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
export type HTTPMethod = "GET" | "HEAD" | "PATCH" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE"

// eslint-disable-next-line unicorn/text-encoding-identifier-case
export type Encoding = false | "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex"

export type JSONType = string | number | boolean | null | JSONType[] | { [key: string]: JSONType }

export interface H3EventContext extends Record<string, any> {}

export type EventHandlerResponse<T = unknown> = T | Promise<T>

export interface EventHandlerFunction<T = unknown> {
  (event: H3Event): EventHandlerResponse<T>
}

export interface EventHandler<T =
 // Default type
 Readable |
  // Interpreted as html
  string |
  // 204
  null |
  // Send raw buffer
  Buffer |
  // Throw error
  Error |
  // No op (undefined)
  void |
  // If none of the objects match above
  JSONType
  > extends EventHandlerFunction<T> {
  "__is_handler__": true
  default: EventHandlerFunction<T>;
}

export type LazyEventHandlerFactory = () => EventHandler | Promise<EventHandler>

export type RequestHeaders = { [name: string]: string | undefined }

export const RawBodySymbol = Symbol.for("h3RawBody");
export const ParsedBodySymbol = Symbol.for("h3ParsedBody");
