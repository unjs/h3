import type * as crossws from "crossws";
import type { H3Event } from "./event";
import type {
  EventHandler,
  EventHandlerRequest,
  ResolvedEventHandler,
  ResponseBody,
} from "./handler";
import type { H3Error } from "../error";
import type { HTTPMethod } from "./http";
import { H3EventContext } from "./context";

export type { H3Error } from "../error";

type AddRoute = (route: string, handler: EventHandler | App) => App;

export interface App {
  readonly config: AppConfig;

  /** websocket options */
  websocket: WebSocketOptions;

  /** fetch request */
  fetch(
    input: Request | URL | string,
    details?: RequestInit & { h3?: { context?: H3EventContext } },
  ): Promise<Response>;

  /** main event handler */
  handler: EventHandler<EventHandlerRequest, Promise<unknown>>;

  /** resolve event handler */
  resolve: (
    method: HTTPMethod,
    path: string,
  ) => Promise<ResolvedEventHandler | undefined>;

  /** add middleware */
  use(
    route: string,
    handler: EventHandler | App,
    details?: Partial<AppEntry>,
  ): App;
  use(handler: EventHandler | App, details?: Partial<AppEntry>): App;
  use(details: AppEntry): App;

  /** add route */
  add: (
    method: "" | HTTPMethod | Lowercase<HTTPMethod>,
    path: string,
    handler: EventHandler | App,
  ) => App;
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

export interface AppEntry {
  route?: string;
  method?: HTTPMethod;
  handler: EventHandler;
}

type MaybePromise<T> = T | Promise<T>;

export interface AppConfig {
  debug?: boolean;
  websocket?: WebSocketOptions;

  onError?: (error: H3Error, event: H3Event) => MaybePromise<void | unknown>;
  onRequest?: (event: H3Event) => MaybePromise<void>;
  onBeforeResponse?: (
    event: H3Event,
    response: AppResponse,
  ) => MaybePromise<void>;
  onAfterResponse?: (
    event: H3Event,
    response?: AppResponse,
  ) => MaybePromise<void>;
}

export type WebSocketOptions = {
  resolve?: crossws.ResolveHooks;
  hooks?: Partial<crossws.Hooks>;
  adapterHooks?: Partial<crossws.AdapterHooks>;
};

export interface AppResponse {
  error?: H3Error;
  body: ResponseBody;
  contentType?: string;
  headers?: Headers;
  status?: number;
  statusText?: string;
}
