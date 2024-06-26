import type {
  H3EventContext,
  H3Event,
  ProxyOptions,
  Duplex,
  ResponseBody,
} from "../types";
import { splitCookiesString } from "./cookie";
import { sanitizeStatusMessage, sanitizeStatusCode } from "./sanitize";
import { _kRaw } from "../event";
import { createError } from "../error";
import {
  PayloadMethods,
  getFetch,
  ignoredHeaders,
  mergeHeaders,
  rewriteCookieProperty,
} from "./internal/proxy";

/**
 * Proxy the incoming request to a target URL.
 */
export async function proxyRequest(
  event: H3Event,
  target: string,
  opts: ProxyOptions = {},
) {
  // Request Body
  let body;
  let duplex: Duplex | undefined;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = event[_kRaw].getBodyStream();
      duplex = "half";
    } else {
      body = await event[_kRaw].readRawBody();
    }
  }

  // Method
  const method = opts.fetchOptions?.method || event.method;

  // Headers
  const fetchHeaders = mergeHeaders(
    getProxyRequestHeaders(event),
    opts.fetchOptions?.headers,
    opts.headers,
  );

  return proxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders,
    },
  });
}

/**
 * Make a proxy request to a target URL and send the response back to the client.
 */
export async function proxy(
  event: H3Event,
  target: string,
  opts: ProxyOptions = {},
): Promise<ResponseBody> {
  let response: Response | undefined;
  try {
    response = await getFetch(opts.fetch)(target, {
      headers: opts.headers as HeadersInit,
      ignoreResponseError: true, // make $ofetch.raw transparent
      ...opts.fetchOptions,
    });
  } catch (error) {
    throw createError({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error,
    });
  }
  event[_kRaw].responseCode = sanitizeStatusCode(
    response.status,
    event[_kRaw].responseCode,
  );
  event[_kRaw].responseMessage = sanitizeStatusMessage(response.statusText);

  const cookies: string[] = [];

  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event[_kRaw].setResponseHeader(key, value);
  }

  if (cookies.length > 0) {
    const _cookies = cookies.map((cookie) => {
      if (opts.cookieDomainRewrite) {
        cookie = rewriteCookieProperty(
          cookie,
          opts.cookieDomainRewrite,
          "domain",
        );
      }
      if (opts.cookiePathRewrite) {
        cookie = rewriteCookieProperty(cookie, opts.cookiePathRewrite, "path");
      }
      return cookie;
    });
    for (const cookie of _cookies) {
      event[_kRaw].appendResponseHeader("set-cookie", cookie);
    }
  }

  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }

  // Directly send consumed _data
  if ((response as any)._data !== undefined) {
    return (response as any)._data;
  }

  // Send at once
  if (opts.sendStream === false) {
    return new Uint8Array(await response.arrayBuffer());
  }

  // Send as stream
  return response.body;
}

/**
 * Get the request headers object without headers known to cause issues when proxying.
 */
export function getProxyRequestHeaders(event: H3Event) {
  const headers = Object.create(null);
  for (const [name, value] of event[_kRaw].getHeaders()) {
    if (!ignoredHeaders.has(name)) {
      headers[name] = value;
    }
  }
  return headers;
}

/**
 * Make a fetch request with the event's context and headers.
 */
export function fetchWithEvent<
  T = unknown,
  _R = unknown,
  F extends (req: RequestInfo | URL, opts?: any) => any = typeof fetch,
>(
  event: H3Event,
  req: RequestInfo | URL,
  init?: RequestInit & { context?: H3EventContext },
  options?: { fetch: F },
): unknown extends T ? ReturnType<F> : T {
  return getFetch(options?.fetch)(req, <RequestInit>{
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event),
      ...init?.headers,
    },
  });
}
