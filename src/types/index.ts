import type { QueryObject } from "ufo";
import type { Hooks as WSHooks } from "crossws";
import type { H3Event } from "../event";
import type { Session } from "../utils/session";
import type { RouteNode } from "../router";
import type { AnyNumber } from "./_utils";

export type {
  ValidateFunction,
  ValidateResult,
} from "../utils/internal/validate";

// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
// prettier-ignore
export type HTTPMethod =  "GET" | "HEAD" | "PATCH" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE";

// prettier-ignore
// eslint-disable-next-line unicorn/text-encoding-identifier-case
export type Encoding =  false | "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";

// prettier-ignore
export type StatusCode = 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 444 | 450 | 451 | 497 | 498 | 499 | 500 | 501 | 502 | 503 | 504 | 506 | 507 | 508 | 509 | 510 | 511 | 521 | 522 | 523 | 525 | 530 | 599 | AnyNumber;

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

export type { MimeType } from "./_mimes";
export type { TypedHeaders, RequestHeaders, HTTPHeaderName } from "./_headers";
