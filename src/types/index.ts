import type { QueryObject } from "ufo";
import type { Hooks as WSHooks } from "crossws";
import type { H3Event } from "../event";
import type { Session } from "../utils/session";
import type { RouteNode } from "../router";

export type {
  ValidateFunction,
  ValidateResult,
} from "../utils/internal/validate";

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
  /**
   * Matched router Node
   *
   * @experimental The object structure may change in non-major version.
   */
  matchedRoute?: RouteNode;
  /* Cached session data */
  sessions?: Record<string, Session>;
  /* Trusted IP Address of client */
  clientAddress?: string;
}

export type EventHandlerResponse<T = any> = T | Promise<T>;

export interface EventHandlerRequest {
  body?: any; // TODO: Default to unknown in next major version
  query?: QueryObject;
  routerParams?: Record<string, string>;
}

export type InferEventInput<
  Key extends keyof EventHandlerRequest,
  Event extends H3Event,
  T,
> = void extends T ? (Event extends H3Event<infer E> ? E[Key] : never) : T;

type MaybePromise<T> = T | Promise<T>;

export type EventHandlerResolver = (
  path: string,
) => MaybePromise<undefined | { route?: string; handler: EventHandler }>;

export interface EventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> {
  __is_handler__?: true;
  __resolve__?: EventHandlerResolver;
  __websocket__?: Partial<WSHooks>;
  (event: H3Event<Request>): Response;
}

export type _RequestMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
> = (event: H3Event<Request>) => void | Promise<void>;

export type _ResponseMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> = (
  event: H3Event<Request>,
  response: { body?: Awaited<Response> },
) => void | Promise<void>;

export type EventHandlerObject<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> = {
  onRequest?: _RequestMiddleware<Request> | _RequestMiddleware<Request>[];
  onBeforeResponse?:
    | _ResponseMiddleware<Request, Response>
    | _ResponseMiddleware<Request, Response>[];
  /** @experimental */
  websocket?: Partial<WSHooks>;
  handler: EventHandler<Request, Response>;
};

export type LazyEventHandler = () => EventHandler | Promise<EventHandler>;

export type { ContentType } from "./_mimes";

export type {
  TypedHeaders,
  RequestHeaders,
  HTTPHeaderName,
  StatusCode,
} from "./_headers";
