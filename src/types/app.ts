import type { AdapterOptions as CrossWSAdapterOptions } from "crossws";
import type { H3Event } from "./event";
import type {
  EventHandler,
  EventHandlerRequest,
  EventHandlerResolver,
  ResponseBody,
} from "./handler";
import type { H3Error } from "../error";
import type { HTTPMethod } from "./http";

export type { H3Error } from "../error";

type AddRoute = (path: string, handler: EventHandler) => App;

export interface App {
  readonly config: AppConfig;

  /** websocket options */
  readonly websocket: WebSocketOptions;

  /** add middleware */
  use(
    prefix: string,
    handler: EventHandler | App,
    details?: Partial<AppEntry>,
  ): App;
  use(handler: EventHandler | App, details?: Partial<AppEntry>): App;
  use(details: AppEntry): App;

  /** main event handler */
  handler: EventHandler<EventHandlerRequest, Promise<ResponseBody>>;

  /** resolve event handler */
  resolve: EventHandlerResolver;

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
  add: (
    method: "" | HTTPMethod | Lowercase<HTTPMethod>,
    path: string,
    handler: EventHandler,
  ) => App;
}

export interface AppEntry {
  route?: string;
  prefix?: string;
  method?: HTTPMethod;
  handler: EventHandler;
}

type MaybePromise<T> = T | Promise<T>;

export interface AppConfig {
  debug?: boolean;
  preemptive?: boolean;
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
  websocket?: WebSocketOptions;
}

export type WebSocketOptions = CrossWSAdapterOptions;

export interface AppResponse {
  error?: H3Error;
  body: ResponseBody;
  contentType?: string;
  headers?: Headers;
  status?: number;
  statusText?: string;
}
