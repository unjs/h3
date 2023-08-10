import { getQuery as _getQuery } from "ufo";
import { createError } from "../error";
import type { HTTPMethod, InferEventInput, RequestHeaders } from "../types";
import type { H3Event } from "../event";
import { validateData, ValidateFunction } from "./internal/validate";

export function getQuery<
  T,
  Event extends H3Event = H3Event,
  _T = Exclude<InferEventInput<"query", Event, T>, undefined>,
>(event: Event): _T {
  return _getQuery(event.path || "") as _T;
}

export function getValidatedQuery<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"query", Event, T>,
>(event: Event, validate: ValidateFunction<_T>): Promise<_T> {
  const query = getQuery(event);
  return validateData(query, validate);
}

export function getRouterParams(
  event: H3Event,
): NonNullable<H3Event["context"]["params"]> {
  // Fallback object needs to be returned in case router is not used (#149)
  return event.context.params || {};
}

export function getRouterParam(
  event: H3Event,
  name: string,
): string | undefined {
  const params = getRouterParams(event);

  return params[name];
}

/**
 * @deprecated Directly use `event.method` instead.
 */
export function getMethod(
  event: H3Event,
  defaultMethod: HTTPMethod = "GET",
): HTTPMethod {
  return (event.node.req.method || defaultMethod).toUpperCase() as HTTPMethod;
}

export function isMethod(
  event: H3Event,
  expected: HTTPMethod | HTTPMethod[],
  allowHead?: boolean,
) {
  if (allowHead && event.method === "HEAD") {
    return true;
  }

  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }

  return false;
}

export function assertMethod(
  event: H3Event,
  expected: HTTPMethod | HTTPMethod[],
  allowHead?: boolean,
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
  name: string,
): RequestHeaders[string] {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}

export const getHeader = getRequestHeader;

export function getRequestHost(
  event: H3Event,
  opts: { xForwardedHost?: boolean } = {},
) {
  if (opts.xForwardedHost) {
    const xForwardedHost = event.node.req.headers["x-forwarded-host"] as string;
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}

export function getRequestProtocol(
  event: H3Event,
  opts: { xForwardedProto?: boolean } = {},
) {
  if (
    opts.xForwardedProto !== false &&
    event.node.req.headers["x-forwarded-proto"] === "https"
  ) {
    return "https";
  }
  return (event.node.req.connection as any).encrypted ? "https" : "http";
}

const DOUBLE_SLASH_RE = /[/\\]{2,}/g;

export function getRequestPath(event: H3Event): string {
  const path = event._originalPath;
  if (path.includes("?")) {
    const [basePath, query] = path.split("?");
    return basePath.replace(DOUBLE_SLASH_RE, "/") + "?" + query;
  } else {
    return path.replace(DOUBLE_SLASH_RE, "/");
  }
}

export function getRequestURL(
  event: H3Event,
  opts: { xForwardedHost?: boolean; xForwardedProto?: boolean } = {},
) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event);
  const path = getRequestPath(event);
  return new URL(path, `${protocol}://${host}`);
}

export function getRequestIP(
  event: H3Event,
  opts: { xForwardedFor?: boolean } = {},
) {
  const ip = (event.node.req.connection as any).remoteAddress;

  if (!opts.xForwardedFor) {
    return ip;
  }

  const xForwardedFor = getRequestHeader(event, "x-forwarded-for")
    ?.split(",")
    ?.pop()
  return xForwardedFor || ip;
}
