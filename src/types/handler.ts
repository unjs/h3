import type { QueryObject } from "ufo";
import type { H3Event } from "./event";
import type { Hooks as WSHooks } from "crossws";

export type EventHandlerResponse<T = unknown> = T | Promise<T>;

export interface EventHandlerRequest {
  body?: unknown;
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

export type RequestMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
> = (event: H3Event<Request>) => void | Promise<void>;

export type ResponseMiddleware<
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
  onRequest?: RequestMiddleware<Request> | RequestMiddleware<Request>[];
  onBeforeResponse?:
    | ResponseMiddleware<Request, Response>
    | ResponseMiddleware<Request, Response>[];
  /** @experimental */
  websocket?: Partial<WSHooks>;
  handler: EventHandler<Request, Response>;
};

export type LazyEventHandler = () => EventHandler | Promise<EventHandler>;

export interface DynamicEventHandler extends EventHandler {
  set: (handler: EventHandler) => void;
}
