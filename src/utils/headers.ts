import { OutgoingMessage } from "node:http";
import { H3Event } from "src/event";
import { RequestHeaders } from "src/types";

export function getRequestHeaders(event: H3Event): RequestHeaders {
  const _headers: RequestHeaders = {};
  if (event.request) {
    for (const key in event.request.headers) {
      const val = event.request.headers.get(key);
      if (val) {
        _headers[key] = Array.isArray(val)
          ? val.filter(Boolean).join(", ")
          : val;
      }
    }
    return _headers;
  }
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}

export function getRequestHeader(
  event: H3Event,
  name: string
): RequestHeaders[string] {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}

export function getRequestRawHeader(event: H3Event, name: string) {
  if (event.request) {
    return event.request.headers.get(name);
  }
  return event.node.req.headers[name];
}

export function getResponseHeaders(
  event: H3Event
): ReturnType<H3Event["res"]["getHeaders"]> {
  if (event.request) {
    return Object.fromEntries(event._internalData.headers);
  }
  return event.node.res.getHeaders();
}

export function getResponseHeader(
  event: H3Event,
  name: string
): ReturnType<H3Event["res"]["getHeader"]> {
  if (event.request) {
    return event._internalData.headers.get(name);
  }
  return event.node.res.getHeader(name);
}

export function setResponseHeaders(
  event: H3Event,
  headers: Record<string, Parameters<OutgoingMessage["setHeader"]>[1]>
): void {
  for (const [name, value] of Object.entries(headers)) {
    setResponseHeader(event, name, value);
  }
}

export function setResponseHeader(
  event: H3Event,
  name: string,
  value: Parameters<OutgoingMessage["setHeader"]>[1]
) {
  if (event.request) {
    return event._internalData.headers.set(name, value as any);
  }
  return event.node.res.setHeader(name, value);
}

export function appendResponseHeaders(
  event: H3Event,
  headers: Record<string, string>
): void {
  for (const [name, value] of Object.entries(headers)) {
    appendResponseHeader(event, name, value);
  }
}

export function appendResponseHeader(
  event: H3Event,
  name: string,
  value: string
): void {
  let current = getResponseHeader(event, name);

  if (!current) {
    setResponseHeader(event, name, value);
    return;
  }

  if (!Array.isArray(current)) {
    current = [current.toString()];
  }

  setResponseHeader(event, name, [...current, value]);
}

export const getHeaders = getRequestHeaders;

export const getHeader = getRequestHeader;

export const setHeaders = setResponseHeaders;

export const setHeader = setResponseHeader;

export const appendHeaders = appendResponseHeaders;

export const appendHeader = appendResponseHeader;
