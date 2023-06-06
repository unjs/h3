import type { H3Event } from "../event";
import type { H3EventContext, RequestHeaders } from "../types";
import { getMethod } from "./request";
import { readRawBody } from "./body";
import { splitCookiesString } from "./cookie";
import { sanitizeStatusMessage, sanitizeStatusCode } from "./sanitize";
import {
  appendResponseHeader,
  getRequestHeaders,
  setResponseHeader,
} from "./headers";
import { sendResponseWithInternal, setResponseStatus } from "./response";

export interface ProxyOptions {
  headers?: RequestHeaders | HeadersInit;
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
  sendStream?: boolean;
  cookieDomainRewrite?: string | Record<string, string>;
  cookiePathRewrite?: string | Record<string, string>;
}

const PayloadMethods = new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
]);

export async function proxyRequest(
  event: H3Event,
  target: string,
  opts: ProxyOptions = {}
) {
  // Method
  const method = getMethod(event);

  // Body
  let body;
  if (PayloadMethods.has(method)) {
    body = await readRawBody(event).catch(() => undefined);
  }

  // Headers
  const headers = getProxyRequestHeaders(event);
  if (opts.fetchOptions?.headers) {
    Object.assign(headers, opts.fetchOptions.headers);
  }
  if (opts.headers) {
    Object.assign(headers, opts.headers);
  }

  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      headers,
      method,
      body,
      ...opts.fetchOptions,
    },
  });
}

export async function sendProxy(
  event: H3Event,
  target: string,
  opts: ProxyOptions = {}
) {
  const response = await _getFetch(opts.fetch)(target, {
    headers: opts.headers as HeadersInit,
    ...opts.fetchOptions,
  });
  setResponseStatus(event, response.status, response.statusText);

  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      const cookies = splitCookiesString(value).map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      });
      for (const cookie of cookies) {
        appendResponseHeader(event, "set-cookie", cookie);
      }
      continue;
    }

    setResponseHeader(event, key, value);
  }

  if (event.request) {
    return sendResponseWithInternal(event, response);
  }
  // Directly send consumed _data
  if ((response as any)._data !== undefined) {
    return (response as any)._data;
  }

  // Send at once
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }

  // Send as stream
  for await (const chunk of response.body as any as AsyncIterable<Uint8Array>) {
    event.node.res.write(chunk);
  }
  return event.node.res.end();
}

export function getProxyRequestHeaders(event: H3Event) {
  const headers = Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name)) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}

export function fetchWithEvent(
  event: H3Event,
  req: RequestInfo | URL,
  init?: RequestInit & { context?: H3EventContext },
  options?: { fetch: typeof fetch }
) {
  return _getFetch(options?.fetch)(req, <RequestInit>{
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event),
      ...init?.headers,
    },
  });
}

// -- internal utils --

function _getFetch(_fetch?: typeof fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}

function rewriteCookieProperty(
  header: string,
  map: string | Record<string, string>,
  property: string
) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
