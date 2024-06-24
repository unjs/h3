import type { AdapterOptions as WSOptions } from "crossws";
import type { H3Event } from "./event";
import type { EventHandler, EventHandlerResolver } from "./handler";
import type { H3Error } from "../error";

export type { H3Error } from "../error";

export interface Layer {
  route: string;
  match?: Matcher;
  handler: EventHandler;
}

export type Stack = Layer[];

export interface InputLayer {
  route?: string;
  match?: Matcher;
  handler: EventHandler;
  lazy?: boolean;
}

export type InputStack = InputLayer[];

export type Matcher = (url: string, event?: H3Event) => boolean;

export interface AppUse {
  (
    route: string | string[],
    handler: EventHandler | EventHandler[],
    options?: Partial<InputLayer>,
  ): App;
  (handler: EventHandler | EventHandler[], options?: Partial<InputLayer>): App;
  (options: InputLayer): App;
}

export type WebSocketOptions = WSOptions;

export interface AppOptions {
  debug?: boolean;
  onError?: (error: H3Error, event: H3Event) => any;
  onRequest?: (event: H3Event) => void | Promise<void>;
  onBeforeResponse?: (
    event: H3Event,
    response: { body?: unknown },
  ) => void | Promise<void>;
  onAfterResponse?: (
    event: H3Event,
    response?: { body?: unknown },
  ) => void | Promise<void>;
  websocket?: WebSocketOptions;
}

export interface App {
  stack: Stack;
  handler: EventHandler;
  options: AppOptions;
  use: AppUse;
  resolve: EventHandlerResolver;
  readonly websocket: WebSocketOptions;
}
