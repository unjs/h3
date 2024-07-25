import type * as crossws from "crossws";
import type { H3Event } from "./event";
import type {
  EventHandler,
  EventHandlerRequest,
  ResolvedEventHandler,
} from "./handler";
import type { H3Error } from "../error";
import type { HTTPMethod } from "./http";
import type { H3EventContext } from "./context";

export type { H3Error } from "../error";

export interface H3Config {
  debug?: boolean;
  websocket?: WebSocketOptions;

  onError?: (error: H3Error, event: H3Event) => MaybePromise<void | unknown>;
  onRequest?: (event: H3Event) => MaybePromise<void>;
  onBeforeResponse?: (
    event: H3Event,
    response: Response | PreparedResponse,
  ) => MaybePromise<void>;
  onAfterResponse?: (
    event: H3Event,
    response?: Response | PreparedResponse,
  ) => MaybePromise<void>;
}

export type PreparedResponse = ResponseInit & { body?: BodyInit | null };

export interface WebSocketOptions {
  resolve?: crossws.ResolveHooks;
  hooks?: Partial<crossws.Hooks>;
  adapterHooks?: Partial<crossws.AdapterHooks>;
}

export interface H3Route {
  route?: string;
  method?: HTTPMethod;
  handler: EventHandler;
}

type AddRoute = (route: string, handler: EventHandler | H3) => H3;

type MaybePromise<T = unknown> = T | Promise<T>;

export interface H3 {
  readonly config: H3Config;

  /** websocket options */
  websocket: WebSocketOptions;

  /** fetch request */
  fetch(
    request: Request | URL | string,
    options?: RequestInit & { h3?: H3EventContext },
  ): Response | Promise<Response>;

  /** main event handler */
  handler: EventHandler<EventHandlerRequest, MaybePromise<unknown>>;
  _handler: EventHandler<EventHandlerRequest, MaybePromise<unknown>>;

  /** resolve event handler */
  resolve: (
    method: HTTPMethod,
    path: string,
  ) => Promise<ResolvedEventHandler | undefined>;

  /** add middleware */
  use(
    route: string,
    handler: EventHandler | H3,
    details?: Partial<H3Route>,
  ): H3;
  use(handler: EventHandler | H3, details?: Partial<H3Route>): H3;
  use(details: H3Route): H3;

  on: (
    method: "" | HTTPMethod | Lowercase<HTTPMethod>,
    path: string,
    handler: EventHandler | H3,
  ) => H3;
  all: AddRoute;
  get: AddRoute;
  post: AddRoute;
  put: AddRoute;
  delete: AddRoute;
  patch: AddRoute;
  head: AddRoute;
  options: AddRoute;
  connect: AddRoute;
  trace: AddRoute;
}
