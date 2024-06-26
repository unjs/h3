import type { EventHandlerRequest, H3EventContext, HTTPMethod } from ".";
import type { _kRaw } from "../event";

type MaybePromise<T> = T | Promise<T>;

export interface H3Event<
  _RequestT extends EventHandlerRequest = EventHandlerRequest,
> {
  // Internal raw context
  [_kRaw]: RawEvent;

  // Context
  context: H3EventContext;

  // Request
  readonly method: HTTPMethod;
  readonly path: string;
  readonly headers: Headers;

  toString(): string;
  toJSON(): string;

  // ...State
  _onBeforeResponseCalled: boolean | undefined;
  _onAfterResponseCalled: boolean | undefined;
}

export interface RawEvent {
  // -- Context --
  getContext: () => Record<string, unknown>;

  // -- Request --

  path: string;
  readonly originalPath: string;
  readonly method: HTTPMethod;

  readonly remoteAddress?: string | undefined;
  readonly isSecure?: boolean | undefined;

  getHeader: (key: string) => string | undefined;
  getHeaders: () => Headers;

  readRawBody: () => MaybePromise<Uint8Array | undefined>;
  readTextBody: () => MaybePromise<string | undefined>;
  readFormDataBody: () => MaybePromise<FormData | undefined>;
  getBodyStream: () => ReadableStream<Uint8Array> | undefined;

  // -- Response --

  responseCode: number | undefined;
  responseMessage: string | undefined;

  setResponseHeader: (key: string, value: string) => void;
  appendResponseHeader: (key: string, value: string) => void;
  getResponseHeader: (key: string) => string | undefined;
  getResponseHeaders: () => Headers;
  getResponseSetCookie: () => string[];
  removeResponseHeader: (key: string) => void;
  writeHead: (code: number, message?: string) => void;
  // sendResponse: (data?: RawResponse) => void | Promise<void>;
  writeEarlyHints: (hints: Record<string, string>) => void | Promise<void>;
}
