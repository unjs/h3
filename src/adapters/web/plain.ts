import type { App } from "../../app";
import type { H3EventContext } from "../../types";
import { defineEventHandler } from "../../handler";
import { _handleWebRequestAsPlain } from "./web";

export type PlainHandler = (
  request: PlainRequest,
  context?: H3EventContext,
) => Promise<PlainResponse>;

export interface PlainRequest {
  path: string;
  method: string;
  headers: HeadersInit;
  body?: BodyInit;
}

export interface PlainResponse {
  status: number;
  statusText: string;
  headers: [string, string][];
  setCookie: string[];
  body?: unknown;
}

export function toPlainHandler(app: App) {
  const handler: PlainHandler = async (request, context) => {
    const res = await _handleWebRequestAsPlain(
      app,
      new Request(request.path, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      }),
      context,
    );
    return {
      status: res.status,
      statusText: res.statusText,
      headers: [...res.headers.entries()],
      setCookie: res.headers.getSetCookie(),
      body: res.body,
    };
  };
  return handler;
}

export function fromPlainHandler(handler: PlainHandler) {
  return defineEventHandler(async (event) => {
    const res = await handler(
      {
        method: event.method,
        path: event.path,
        headers: event._raw.getHeaders(),
        body: undefined, // TODO
      },
      event.context,
    );
    event._raw.responseCode = res.status;
    event._raw.responseMessage = res.statusText;
    for (const [key, value] of res.headers) {
      event._raw.setResponseHeader(key, value);
    }
    return res.body;
  });
}
