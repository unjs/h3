import type { QueryObject } from "ufo";
import type { H3Event } from "./event";
import type { Session } from "./utils/session";

export type {
  ValidateFunction,
  ValidateResult,
} from "./utils/internal/validate";

// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
export type HTTPMethod =
  | "GET"
  | "HEAD"
  | "PATCH"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE";

export type Encoding =
  | false
  | "ascii"
  | "utf8"
  | "utf-8" // eslint-disable-line unicorn/text-encoding-identifier-case
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "latin1"
  | "binary"
  | "hex";

export interface H3EventContext extends Record<string, any> {
  /* Matched router parameters */
  params?: Record<string, string>;
  /* Cached session data */
  sessions?: Record<string, Session>;
}

export type EventHandlerResponse<T = any> = T | Promise<T>;

export interface EventHandlerRequest {
  // TODO: Default to unknown in next major version
  body?: any;

  query?: QueryObject;
}

export type InferEventInput<
  Key extends keyof EventHandlerRequest,
  Event extends H3Event,
  T,
> = void extends T ? (Event extends H3Event<infer E> ? E[Key] : never) : T;

export interface EventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> {
  __is_handler__?: true;
  (event: H3Event<Request>): Response;
}

export type EventHandlerObject<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
  ValidateFunction extends (event: H3Event<Request>) => H3Event<Request> | Promise<H3Event<Request>> = (event: H3Event<Request>) => H3Event<any> | Promise<H3Event<any>>,
  ValidatedRequest extends EventHandlerRequest = Awaited<ReturnType<ValidateFunction>> extends H3Event<infer R> ? R : Request,
> = {
  validate?: ValidateFunction;
  handler: EventHandler<ValidatedRequest, Response>;
  before?: ((event: H3Event<ValidatedRequest>) => void | Promise<void>)[];
  after?: ((
    event: H3Event<ValidatedRequest>,
    response: { body?: Response },
  ) => void | Promise<void>)[];
};

export type LazyEventHandler = () => EventHandler | Promise<EventHandler>;

export type RequestHeaders = { [name: string]: string | undefined };
