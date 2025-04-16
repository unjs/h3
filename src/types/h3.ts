import type * as crossws from "crossws";
import type { H3Event } from "./event";
import type { EventHandler } from "./handler";
import type { H3Error } from "../error";
import type { HTTPMethod } from "./http";

export type { H3Error } from "../error";

export type { H3 } from "../h3";

export type MaybePromise<T = unknown> = T | Promise<T>;

export interface H3Config {
  debug?: boolean;
  websocket?: WebSocketOptions;

  onError?: (error: H3Error, event: H3Event) => MaybePromise<void | unknown>;
  onRequest?: (event: H3Event) => MaybePromise<void>;
  onBeforeResponse?: (
    event: H3Event,
    response: Response | PreparedResponse,
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
