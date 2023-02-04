import type { H3Event } from "../event";
import type { RequestHeaders } from "../types";
import { getMethod, getRequestHeaders } from "./request";
import { readRawBody } from "./body";

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
  const headers = Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name)) {
      headers[name] = reqHeaders[name];
    }
  }
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
  const _fetch = opts.fetch || globalThis.fetch;
  if (!_fetch) {
    throw new Error(
      "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
    );
  }

  const response = await _fetch(target, {
    headers: opts.headers as HeadersInit,
    ...opts.fetchOptions,
  });
  event.node.res.statusCode = response.status;
  event.node.res.statusMessage = response.statusText;

  for (const [key, value] of response.headers.entries()) {
    let header = value;

    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      const cookieDomainRewriteConfig =
        typeof opts.cookieDomainRewrite === "string"
          ? { "*": opts.cookieDomainRewrite }
          : opts.cookieDomainRewrite;
      const cookiePathRewriteConfig =
        typeof opts.cookiePathRewrite === "string"
          ? { "*": opts.cookiePathRewrite }
          : opts.cookiePathRewrite;

      if (cookieDomainRewriteConfig) {
        header = rewriteCookieProperty(
          header,
          cookieDomainRewriteConfig,
          "domain"
        );
      }

      if (cookiePathRewriteConfig) {
        header = rewriteCookieProperty(header, cookiePathRewriteConfig, "path");
      }
    }
    event.node.res.setHeader(key, header);
  }

  try {
    if (response.body) {
      if (opts.sendStream === false) {
        const data = new Uint8Array(await response.arrayBuffer());
        event.node.res.end(data);
      } else {
        for await (const chunk of response.body as any as AsyncIterable<Uint8Array>) {
          event.node.res.write(chunk);
        }
        event.node.res.end();
      }
    }
  } catch (error) {
    event.node.res.end();
    throw error;
  }
}

function rewriteCookieProperty(
  header: string,
  config: Record<string, string>,
  property: string
) {
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;

      if (previousValue in config) {
        newValue = config[previousValue];
      } else if ("*" in config) {
        newValue = config["*"];
      } else {
        return match;
      }

      return newValue ? prefix + newValue : "";
    }
  );
}
