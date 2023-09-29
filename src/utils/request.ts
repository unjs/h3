import { getQuery as _getQuery } from "ufo";
import { createError } from "../error";
import type { HTTPMethod, InferEventInput, RequestHeaders } from "../types";
import type { H3Event } from "../event";
import { validateData, ValidateFunction } from "./internal/validate";
import { getRequestWebStream } from "./body";
import crypto from "uncrypto";

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
  return (event.node.req.connection as any)?.encrypted ? "https" : "http";
}

const DOUBLE_SLASH_RE = /[/\\]{2,}/g;
/** @deprecated Use `event.path` instead */
export function getRequestPath(event: H3Event): string {
  const path = (event.node.req.url || "/").replace(DOUBLE_SLASH_RE, "/");
  return path;
}

export function getRequestURL(
  event: H3Event,
  opts: { xForwardedHost?: boolean; xForwardedProto?: boolean } = {},
) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/",
  );
  return new URL(path, `${protocol}://${host}`);
}

export function toWebRequest(event: H3Event) {
  return (
    event.web?.request ||
    new Request(getRequestURL(event), {
      // @ts-ignore Undici option
      duplex: "half",
      method: event.method,
      headers: event.headers,
      body: getRequestWebStream(event),
    })
  );
}

export function getRequestIP(
  event: H3Event,
  opts: {
    /**
     * Use the X-Forwarded-For HTTP header set by proxies.
     *
     * Note: Make sure that this header can be trusted (your application running behind a CDN or reverse proxy) before enabling.
     */
    xForwardedFor?: boolean;
  } = {},
): string | undefined {
  if (event.context.clientAddress) {
    return event.context.clientAddress;
  }

  if (opts.xForwardedFor) {
    const xForwardedFor = getRequestHeader(event, "x-forwarded-for")
      ?.split(",")
      ?.pop();
    if (xForwardedFor) {
      return xForwardedFor;
    }
  }

  if (event.node.req.socket.remoteAddress) {
    return event.node.req.socket.remoteAddress;
  }
}

export async function getFingerprint(event: H3Event): Promise<string> {
  let fingerprint = event.toString();
  const ip = getRequestIP(event, { xForwardedFor: event.headers.has('x-forwarded-for') });

  if (ip) {
    fingerprint += `-${ip}`;
  }

  if (event.headers.has('user-agent')) {
    fingerprint += `-${event.headers.get('user-agent')}`;
  }

  const buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(fingerprint));

  return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
}
