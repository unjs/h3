import type {
  EventHandler,
  H3Event,
  NodeHandler,
  RequestHeaderName,
  RequestHeaders,
  RequestMiddleware,
  ResponseHeaderName,
  ResponseHeaders,
  ResponseMiddleware,
} from "./types";
import type { Readable as NodeReadableStream } from "node:stream";
import { _kRaw } from "./event";
import { getRequestHeader, getRequestHeaders } from "./utils/request";
import { getBodyStream } from "./utils/body";
import {
  appendResponseHeader,
  appendResponseHeaders,
  iterable,
  noContent,
  redirect,
  setResponseHeader,
  setResponseHeaders,
} from "./utils/response";
import {
  defineNodeHandler,
  fromNodeHandler,
  fromNodeRequest,
  toNodeHandler,
} from "./adapters/node";
import {
  readFormDataBody,
  readJSONBody,
  readValidatedJSONBody,
} from "./utils/body";
import { defineEventHandler, defineLazyEventHandler } from "./handler";
import { proxy } from "./utils/proxy";

/** @deprecated Please use `getRequestHeader`  */
export const getHeader = getRequestHeader;

/** @deprecated Please use `getRequestHeaders`  */
export const getHeaders = getRequestHeaders;

/** @deprecated Directly return stream */
export function sendStream(
  _event: H3Event,
  value: ReadableStream | NodeReadableStream,
) {
  return value;
}

/** Please use `defineEventHandler`  */
export const eventHandler = defineEventHandler;

/** Please use `defineLazyEventHandler` */
export const lazyEventHandler = defineLazyEventHandler;

/** @deprecated Please use `appendResponseHeader` */
export const appendHeader = appendResponseHeader;

/** @deprecated Please use  `appendResponseHeaders` */
export const appendHeaders = appendResponseHeaders;

/** @deprecated please use `setResponseHeader`  */
export const setHeader = setResponseHeader;

/** @deprecated Please use `setResponseHeaders` */
export const setHeaders = setResponseHeaders;

/** @deprecated Please use `defineNodeHandler` */
export const defineNodeListener = defineNodeHandler;

/** @deprecated Please use `defineNodeHandler` */
export const fromNodeMiddleware = fromNodeHandler;

/** @deprecated Please use `fromNodeRequest` */
export const createEvent = fromNodeRequest;

/** @deprecated Please use `toNodeHandler` */
export const toNodeListener = toNodeHandler;

/** @deprecated Please use `readJSONBody` */
export const readBody = readJSONBody;

/** @deprecated Please use `readFormDataBody` */
export const readFormData = readFormDataBody;

/** @deprecated Please use `readValidatedJSONBody` */
export const readValidatedBody = readValidatedJSONBody;

/** @deprecated Please use `getBodyStream` */
export const getRequestWebStream = getBodyStream;

/** @deprecated Please use `event.path` instead */
export const getRequestPath = (event: H3Event) => event.path;

/** @deprecated Use `return iterable()` */
export const sendIterable = (
  _event: H3Event,
  ...args: Parameters<typeof iterable>
) => iterable(...args);

/** @deprecated Use `return noContent(event)` */
export const sendNoContent = noContent;

/** @deprecated Use `return redirect(event, code)` */
export const sendRedirect = redirect;

/** @deprecated Use `return response` */
export const sendWebResponse = (response: Response) => response;

/** @deprecated Use `return proxy(event)` */
export const sendProxy = proxy;

/** @deprecated */
export function toEventHandler(
  input: any,
  _?: any,
  _route?: string,
): EventHandler {
  return input;
}

// --- Types ---

/** @deprecated Please use `RequestMiddleware` */
export type _RequestMiddleware = RequestMiddleware;

/** @deprecated Please use `ResponseMiddleware`  */
export type _ResponseMiddleware = ResponseMiddleware;

/** @deprecated Please use `NodeHandler` */
export type NodeListener = NodeHandler;

/** @deprecated Please use `RequestHeaders` or  `ResponseHeaders` */
export type TypedHeaders = RequestHeaders & ResponseHeaders;

/** @deprecated Please use `RequestHeaderName` or `ResponseHeaderName` */
export type HTTPHeaderName = RequestHeaderName | ResponseHeaderName;
