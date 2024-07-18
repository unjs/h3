import type {
  EventHandler,
  H3Event,
  NodeHandler,
  RequestHeaderName,
  RequestMiddleware,
  ResponseHeaderName,
  ResponseHeaders,
  ResponseMiddleware,
} from "./types";
import { iterable, noContent, redirect } from "./utils/response";
import {
  defineNodeHandler,
  fromNodeHandler,
  toNodeHandler,
} from "./adapters/node";
import { defineEventHandler, defineLazyEventHandler } from "./handler";
import { proxy } from "./utils/proxy";
import { createH3 } from "./h3";
import { withBase } from "./utils/base";
import { sanitizeStatusCode, sanitizeStatusMessage } from "./utils/sanitize";
import { RequestHeaders } from "h3-v1";

// --- Request ---

/** @deprecated Please use `event.path` or `event.url` */
export const getRequestPath = (event: H3Event) => event.path;

/** @deprecated Please use `event.request.headers.get(name)` */
export function getRequestHeader(
  event: H3Event,
  name: string,
): string | undefined {
  return event.request.headers.get(name) || undefined;
}

/** @deprecated Please use `event.request.headers.get(name)` */
export const getHeader = getRequestHeader;

/** @deprecated Please use `Object.fromEntries(event.request.headers.entries())` */
export function getRequestHeaders(event: H3Event): Record<string, string> {
  return Object.fromEntries(event.request.headers.entries());
}

/** @deprecated Please use `Object.fromEntries(event.request.headers.entries())` */
export const getHeaders = getRequestHeaders;

/** @deprecated Please use `event.request.method` */
export function getMethod(event: H3Event, defaultMethod = "GET") {
  return (event.request.method || defaultMethod).toUpperCase();
}

// --- Request Body ---

/** @deprecated Please use `event.request.text()` or `event.request.arrayBuffer()` */
export function readRawBody<E extends "utf8" | false = "utf8">(
  event: H3Event,
  encoding = "utf8" as E,
): E extends false
  ? Promise<Uint8Array | undefined>
  : Promise<string | undefined> {
  return encoding
    ? event.request.text()
    : (event.request.arrayBuffer().then((r) => new Uint8Array(r)) as any);
}

/** @deprecated Please use `event.request.formData()` */
export async function readFormDataBody(event: H3Event): Promise<FormData> {
  return event.request.formData();
}

/** @deprecated Please use `event.request.formData()` */
export const readFormData = readFormDataBody;

/** @deprecated Please use `event.request.body` */
export function getBodyStream(
  event: H3Event,
): ReadableStream<Uint8Array> | undefined {
  return event.request.body || undefined;
}

/** @deprecated Please use `event.request.body` */
export const getRequestWebStream = getBodyStream;

// --- Response ---

/** @deprecated Please directly return stream */
export function sendStream(
  _event: H3Event,
  value: ReadableStream,
): ReadableStream {
  return value;
}

/** @deprecated Please use `return noContent(event)` */
export const sendNoContent = noContent;

/** @deprecated Please use `return redirect(event, code)` */
export const sendRedirect = redirect;

/** @deprecated Please directly return response */
export const sendWebResponse = (response: Response) => response;

/** @deprecated Please use `return proxy(event)` */
export const sendProxy = proxy;

/** @deprecated Please use `return iterable(event, value)` */
export const sendIterable = iterable;

/** @deprecated Please use `event.response.statusText` */
export function getResponseStatusText(event: H3Event): string {
  return event.response.statusText || "";
}

/** @deprecated Please use `event.response.headers.append(name, value)` */
export function appendResponseHeader(
  event: H3Event,
  name: string,
  value: string | string[],
): void {
  if (Array.isArray(value)) {
    for (const valueItem of value) {
      event.response.headers.append(name, valueItem!);
    }
  } else {
    event.response.headers.append(name, value!);
  }
}

/** @deprecated Please use `event.response.headers.append(name, value)` */
export const appendHeader = appendResponseHeader;

/** @deprecated Please use `event.response.headers.set(name, value)` */
export function setResponseHeader(
  event: H3Event,
  name: string,
  value: string | string[],
): void {
  if (Array.isArray(value)) {
    event.response.headers.delete(name);
    for (const valueItem of value) {
      event.response.headers.append(name, valueItem!);
    }
  } else {
    event.response.headers.set(name, value!);
  }
}

/** @deprecated Please use `event.response.headers.set(name, value)` */
export const setHeader = setResponseHeader;

/** @deprecated Please use `event.response.headers.set(name, value)` */
export function setResponseHeaders(
  event: H3Event,
  headers: ResponseHeaders,
): void {
  for (const [name, value] of Object.entries(headers)) {
    event.response.headers.set(name, value!);
  }
}

/** @deprecated Please use `event.response.headers.set(name, value)` */
export const setHeaders = setResponseHeaders;

/** @deprecated Please use `event.response.status` */
export function getResponseStatus(event: H3Event): number {
  return event.response.status || 200;
}

/** @deprecated Please directly set `event.response.status` and `event.response.statusText` */
export function setResponseStatus(
  event: H3Event,
  code?: number,
  text?: string,
): void {
  if (code) {
    event.response.status = sanitizeStatusCode(code, event.response.status);
  }
  if (text) {
    event.response.statusText = sanitizeStatusMessage(text);
  }
}

/** @deprecated Please use `event.response.headers.set("content-type", type)` */
export function defaultContentType(event: H3Event, type?: string) {
  if (
    type &&
    event.response.status !== 304 /* unjs/h3#603 */ &&
    !event.response.headers.has("content-type")
  ) {
    event.response.headers.set("content-type", type);
  }
}

/** @deprecated Please use `Object.fromEntries(event.response.headers.entries())` */
export function getResponseHeaders(event: H3Event): Record<string, string> {
  return Object.fromEntries(event.response.headers.entries());
}

/** @deprecated Please use `event.response.headers.get(name)` */
export function getResponseHeader(
  event: H3Event,
  name: string,
): string | undefined {
  return event.response.headers.get(name) || undefined;
}

/** @deprecated Please use `event.response.headers.delete(name)` instead. */
export function removeResponseHeader(
  event: H3Event,
  name: ResponseHeaderName,
): void {
  return event.response.headers.delete(name);
}

/** @deprecated Please use `event.response.headers.append(name, value)` */
export function appendResponseHeaders(
  event: H3Event,
  headers: ResponseHeaders,
): void {
  for (const [name, value] of Object.entries(headers)) {
    appendResponseHeader(event, name, value!);
  }
}

/** @deprecated Please use `event.response.headers.append(name, value)` */
export const appendHeaders = appendResponseHeaders;

/** @deprecated Please use `event.response.headers.delete` */
export function clearResponseHeaders(
  event: H3Event,
  headerNames?: ResponseHeaderName[],
): void {
  if (headerNames && headerNames.length > 0) {
    for (const name of headerNames) {
      event.response.headers.delete(name);
    }
  } else {
    for (const name of event.response.headers.keys()) {
      event.response.headers.delete(name);
    }
  }
}

// -- Event handler --

/** Please use `defineEventHandler`  */
export const eventHandler = defineEventHandler;

/** Please use `defineLazyEventHandler` */
export const lazyEventHandler = defineLazyEventHandler;

/** @deprecated Please use `defineNodeHandler` */
export const defineNodeListener = defineNodeHandler;

/** @deprecated Please use `defineNodeHandler` */
export const fromNodeMiddleware = fromNodeHandler;

/** @deprecated Please use `toNodeHandler` */
export const toNodeListener = toNodeHandler;

/** @deprecated */
export function toEventHandler(
  input: any,
  _?: any,
  _route?: string,
): EventHandler {
  return input;
}

// -- App/Router --

/** @deprecated Please use `createH3()` */
export const createApp = createH3;

/** @deprecated Please use `createH3()` */
export const createRouter = createH3;

/** @deprecated Please use `withBase()` */
export const useBase = withBase;

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
