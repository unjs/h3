import type { H3Event } from "../event";
import type { RequestHeaders } from "../types";
import { getMethod, getRequestHeaders } from "./request";
import { readRawBody } from "./body";
import splitCookiesString from "./internal/split-cookies-string";

export interface ProxyOptions {
  headers?: RequestHeaders | HeadersInit;
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
  sendStream?: boolean;
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
  event.node.res.statusCode = response.status;
  event.node.res.statusMessage = response.statusText;

  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      event.node.res.setHeader("set-cookie", splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
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
  init?: RequestInit,
  options?: { fetch: typeof fetch }
) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    // @ts-ignore (context is used for unenv and local fetch)
    context: init.context || event.context,
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
