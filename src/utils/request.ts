import { getQuery as _getQuery, decode as decodeURI } from "ufo";
import { createError } from "../error";
import type {
  HTTPHeaderName,
  HTTPMethod,
  InferEventInput,
  RequestHeaders,
} from "../types";
import type { H3Event } from "../event";
import { validateData, ValidateFunction } from "./internal/validate";
import { getRequestWebStream } from "./body";

/**
 * Get query the params object from the request URL parsed with [unjs/ufo](https://ufo.unjs.io).
 */
export function getQuery<
  T,
  Event extends H3Event = H3Event,
  _T = Exclude<InferEventInput<"query", Event, T>, undefined>,
>(event: Event): _T {
  return _getQuery(event.path || "") as _T;
}

/**
 * Get the query param from the request URL parsed with [unjs/ufo](https://ufo.unjs.io) and validated with validate function.
 */
export function getValidatedQuery<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"query", Event, T>,
>(event: Event, validate: ValidateFunction<_T>): Promise<_T> {
  const query = getQuery(event);
  return validateData(query, validate);
}

/**
 * Get matched route params.
 *
 * If `decode` option is `true`, it will decode the matched route params using `decodeURI`.
 */
export function getRouterParams(
  event: H3Event,
  opts: { decode?: boolean } = {},
): NonNullable<H3Event["context"]["params"]> {
  // Fallback object needs to be returned in case router is not used (#149)
  let params = event.context.params || {};
  if (opts.decode) {
    params = { ...params };
    for (const key in params) {
      params[key] = decodeURI(params[key]);
    }
  }

  return params;
}

/**
 * Get matched route params and validate with validate function.
 */
export function getValidatedRouterParams<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"routerParams", Event, T>,
>(
  event: Event,
  validate: ValidateFunction<_T>,
  opts: { decode?: boolean } = {},
): Promise<_T> {
  const routerParams = getRouterParams(event, opts);

  return validateData(routerParams, validate);
}

/**
 * Get a matched route param by name.
 */
export function getRouterParam(
  event: H3Event,
  name: string,
  opts: { decode?: boolean } = {},
): string | undefined {
  const params = getRouterParams(event, opts);

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

/**
 *
 * Checks if the incoming request method is of the expected type.
 *
 * If `allowHead` is `true`, it will allow `HEAD` requests to pass if the expected method is `GET`.
 *
 */
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

/**
 * Asserts that the incoming request method is of the expected type using `isMethod`.
 *
 * If the method is not allowed, it will throw a 405 error with the message "HTTP method is not allowed".
 */
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

/**
 * Get the request headers object.
 *
 * Array headers are joined with a comma.
 */
export function getRequestHeaders(event: H3Event): RequestHeaders {
  const _headers: RequestHeaders = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}

/**
 * Alias for `getRequestHeaders`.
 */
export const getHeaders = getRequestHeaders;

/**
 * Get a request header by name.
 */
export function getRequestHeader(
  event: H3Event,
  name: HTTPHeaderName,
): RequestHeaders[string] {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}

/**
 * Alias for `getRequestHeader`.
 */
export const getHeader = getRequestHeader;

/**
 * Get the request hostname.
 *
 * If `xForwardedHost` is `true`, it will use the `x-forwarded-host` header if it exists.
 *
 * If no host header is found, it will default to "localhost".
 */
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

/**
 * Get the request protocol.
 *
 * If `x-forwarded-proto` header is set to "https", it will return "https". You can disable this behavior by setting `xForwardedProto` to `false`.
 *
 * If protocol cannot be determined, it will default to "http".
 */
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

/**
 * Generated the full incoming request URL using `getRequestProtocol`, `getRequestHost` and `event.path`.
 *
 * If `xForwardedHost` is `true`, it will use the `x-forwarded-host` header if it exists.
 *
 * If `xForwardedProto` is `false`, it will not use the `x-forwarded-proto` header.
 */
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

/**
 * Convert the H3Event to a WebRequest object.
 *
 * **NOTE:** This function is not stable and might have edge cases that are not handled properly.
 */
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

/**
 * Try to get the client IP address from the incoming request.
 *
 * If `xForwardedFor` is `true`, it will use the `x-forwarded-for` header if it exists.
 *
 * If IP cannot be determined, it will default to `undefined`.
 */
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
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For#syntax
    const xForwardedFor = getRequestHeader(event, "x-forwarded-for")
      ?.split(",")
      .shift()
      ?.trim();
    if (xForwardedFor) {
      return xForwardedFor;
    }
  }

  if (event.node.req.socket.remoteAddress) {
    return event.node.req.socket.remoteAddress;
  }
}
