import type { EventHandlerRequest, H3EventContext, HTTPMethod } from ".";

export interface H3Event<
  _RequestT extends EventHandlerRequest = EventHandlerRequest,
> {
  _raw: RawEvent;

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
  // ...Request
  path: string;
  originalPath?: string;
  readonly remoteAddress?: string | undefined;
  readonly isSecure?: boolean | undefined;
  readonly method: HTTPMethod;
  getHeader: (key: string) => string | null | undefined;
  getHeaders: () => HeadersInit;

  // ...Response
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

  // ...State
  readonly handled?: boolean;
}
