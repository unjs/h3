import type { H3Event } from "../event";
import type { RequestHeaders } from "../types";
import { getMethod, getRequestHeaders } from "./request";
import { readRawBody } from "./body";

export interface ProxyOptions {
  headers?: RequestHeaders | HeadersInit
  fetchOptions?: RequestInit
  fetch?: typeof fetch
  sendStream?: boolean
}

const PayloadMethods = new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect"
]);

/**
 * Rejects if body is unparsable
 */
export async function proxyRequest (event: H3Event, target: string, opts: ProxyOptions = {}) {
  // Method
  const defaultMethod = getMethod(event);

  // Body
  const defaultBody = PayloadMethods.has(defaultMethod)
  // This method might reject
    ? await readRawBody(event)
    // Defaults to undefined
    : undefined;

  // Headers
  const defaultHeaders = Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name)) {
      defaultHeaders[name] = reqHeaders[name];
    }
  }
  if (opts.fetchOptions?.headers) {
    Object.assign(defaultHeaders, opts.fetchOptions!.headers);
  }
  if (opts.headers) {
    Object.assign(defaultHeaders, opts.headers);
  }

  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      headers: defaultHeaders,
      method: defaultMethod,
      body: defaultBody,
      ...opts.fetchOptions
    }
  });
}

export async function sendProxy (event: H3Event, target: string, opts: ProxyOptions = {}) {
  const _fetch = opts.fetch ?? globalThis.fetch;
  if (!_fetch) {
    throw new Error("fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js.");
  }

  const response = await _fetch(target, {
    headers: opts.headers as HeadersInit,
    ...opts.fetchOptions
  });

  event.node.res.statusCode = response.status;
  event.node.res.statusMessage = response.statusText;

  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") { continue; }
    if (key === "content-length") { continue; }
    event.node.res.setHeader(key, value);
  }

  let data: Uint8Array | undefined;

  try {
    if (response.body) {
      if (opts.sendStream === false) {
        data = new Uint8Array(await response.arrayBuffer());
      } else {
        for await (const chunk of response.body as any as AsyncIterable<Uint8Array>) {
          event.node.res.write(chunk);
        }
      }
    }
  } finally {
    event.node.res.end(data);
  }
}
