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
  // readonly headers: Headers;

  toString(): string;
  toJSON(): string;

  // ...State
  _onBeforeResponseCalled: boolean | undefined;
  _onAfterResponseCalled: boolean | undefined;
}

export interface RawEvent {
  // -- Request --

  path: string;
  originalPath?: string;
  readonly method: HTTPMethod;
  readonly remoteAddress?: string | undefined;
  readonly isSecure?: boolean | undefined;

  getHeader: (key: string) => string | null | undefined;
  getHeaders: () => HeadersInit;

  readRawBody: () => MaybePromise<Uint8Array | undefined>;
  readTextBody: () => MaybePromise<string | undefined>;
  readFormDataBody: () => MaybePromise<FormData | undefined>;
  readBodyStream: () => ReadableStream<Uint8Array> | undefined;

  // -- Response --

  readonly handled?: boolean;

  responseCode: number | undefined;
  responseMessage: string | undefined;

  setResponseHeader(key: string, value: string): void;
  appendResponseHeader(key: string, value: string): void;
  getResponseHeader(key: string): string | null | undefined;
  getResponseHeaders(): HeadersInit;
  getResponseSetCookie(): string[];
  removeResponseHeader(key: string): void;

  writeHead(code: number, message?: string): void;

  sendResponse(body?: any): void;

  sendStream(body: any): void | Promise<void>;

  writeEarlyHints(
    hints: Record<string, string | string[]>,
  ): void | Promise<void>;
}
