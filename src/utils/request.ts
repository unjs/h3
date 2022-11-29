import { getQuery as _getQuery } from "ufo";
import { createError } from "../error";
import type { HTTPMethod, RequestHeaders } from "../types";
import type { H3Event } from "../event";

export function getQuery (event: H3Event) {
  return _getQuery(event.node.req.url ?? "");
}

export function getRouterParams (event: H3Event): H3Event["context"] {
  // Fallback object needs to be returned in case router is not used (#149)
  return event.context.params ?? {};
}

export function getRouterParam (event: H3Event, name: string): H3Event["context"][string] {
  const params = getRouterParams(event);

  return params[name];
}

export function getMethod (event: H3Event, defaultMethod: HTTPMethod = "GET"): HTTPMethod {
  return (event.node.req.method ?? defaultMethod).toUpperCase() as HTTPMethod;
}

export function isMethod (event: H3Event, expected: HTTPMethod | readonly HTTPMethod[], allowHead: boolean = false) {
  const method = getMethod(event);

  if (allowHead && method === "HEAD") {
    return true;
  }

  if (
    expected === method ||
    (Array.isArray(expected) && expected.includes(method))) {
    return true;
  }

  return false;
}

export function assertMethod (event: H3Event, expected: HTTPMethod | readonly HTTPMethod[], allowHead: boolean = false) {
  if (!isMethod(event, expected, allowHead)) {
    throw createError({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}

export function getHeaders (event: H3Event): RequestHeaders {
  const _headers: RequestHeaders = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    if (Array.isArray(val)) {
      // string[] headers are casted into string via .join(", ") prior to .join(", ")
      _headers[key] = val.filter(Boolean).join(", ");
    } else {
      _headers[key] = val;
    }
  }
  return _headers;
}

export { getHeaders as getRequestHeaders };

export function getHeader (event: H3Event, name: string): RequestHeaders[string] {
  const headers = getHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}

export { getHeader as getRequestHeader };
