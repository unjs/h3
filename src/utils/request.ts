import { getQuery as _getQuery } from "ufo";
import { createError } from "../error";
import type { HTTPMethod, RequestHeaders } from "../types";
import type { H3Event } from "../event";

export function getQuery(event: H3Event) {
  return _getQuery(event.node.req.url || "");
}

export function getRouterParams(event: H3Event): H3Event["context"] {
  // Fallback object needs to be returned in case router is not used (#149)
  return event.context.params || {};
}

export function getRouterParam(
  event: H3Event,
  name: string
): H3Event["context"][string] {
  const params = getRouterParams(event);

  return params[name];
}

export function getMethod(
  event: H3Event,
  defaultMethod: HTTPMethod = "GET"
): HTTPMethod {
  return (event.node.req.method || defaultMethod).toUpperCase() as HTTPMethod;
}

export function isMethod(
  event: H3Event,
  expected: HTTPMethod | HTTPMethod[],
  allowHead?: boolean
) {
  const method = getMethod(event);

  if (allowHead && method === "HEAD") {
    return true;
  }

  if (typeof expected === "string") {
    if (method === expected) {
      return true;
    }
  } else if (expected.includes(method)) {
    return true;
  }

  return false;
}

export function assertMethod(
  event: H3Event,
  expected: HTTPMethod | HTTPMethod[],
  allowHead?: boolean
) {
  if (!isMethod(event, expected, allowHead)) {
    throw createError({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed.",
    });
  }
}

export function getRequestHeaders(event: H3Event): RequestHeaders {
  const _headers: RequestHeaders = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}

export const getHeaders = getRequestHeaders;

export function getRequestHeader(
  event: H3Event,
  name: string
): RequestHeaders[string] {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}

export const getHeader = getRequestHeader;

export function getRequestHost(event: H3Event, opts: { proxy?: boolean } = {}) {
  return (
    (opts.proxy && event.node.req.headers["x-forwarded-host"]) ||
    event.node.req.headers.host ||
    "localhost"
  );
}

export function getRequestProtocol(
  event: H3Event,
  opts: { proxy?: boolean } = {}
) {
  if (opts.proxy && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return (event.node.req.connection as any).encrypted ? "https" : "http";
}

export function getRequestURL(event: H3Event, opts: { proxy?: boolean } = {}) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event, opts);
  return new URL(event.path || "/", `${protocol}://${host}`);
}
