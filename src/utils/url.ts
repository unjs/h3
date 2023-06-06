import { getRequestRawHeader } from "./headers";
import { H3Event } from "src/event";

export function setOriginalUrlPath(event: H3Event, url: string) {
  if (event.request) {
    event._internalData.originalUrlPath = url;
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-extra-semi
  (event.node.req as any).originalUrlPath = url;
}

export function getOriginalUrlPath(event: H3Event) {
  if (event.request) {
    return event._internalData.originalUrlPath;
  }
  return (event.node.req as any).originalUrlPath as string;
}

export function setUrlPath(event: H3Event, url: string) {
  if (event.request) {
    event._internalData.currentUrlPath = url;
    return;
  }
  event.node.req.url = url;
}

export function getUrlPath(event: H3Event) {
  if (event.request) {
    const url = new URL(event.request.url);
    return event._internalData.currentUrlPath ?? url.pathname + url.search;
  }
  return event.node.req.url || "/";
}

export function getRequestURL(
  event: H3Event,
  opts: { xForwardedHost?: boolean; xForwardedProto?: boolean } = {}
) {
  if (event.request) {
    return new URL(event.request.url);
  }
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event);
  const path = getRequestPath(event);
  return new URL(path, `${protocol}://${host}`);
}

export function getRequestHost(
  event: H3Event,
  opts: { xForwardedHost?: boolean } = {}
) {
  if (opts.xForwardedHost) {
    const xForwardedHost = getRequestRawHeader(event, "x-forwarded-host");
    if (xForwardedHost) {
      return xForwardedHost as string;
    }
  }
  return getRequestRawHeader(event, "host") || "localhost";
}

export function getRequestProtocol(
  event: H3Event,
  opts: { xForwardedProto?: boolean } = {}
) {
  if (
    opts.xForwardedProto !== false &&
    getRequestRawHeader(event, "x-forwarded-proto") === "https"
  ) {
    return "https";
  }
  if (event.request) {
    return new URL(event.request.url).protocol;
  }
  return (event.node.req.connection as any).encrypted ? "https" : "http";
}

const DOUBLE_SLASH_RE = /[/\\]{2,}/g;

export function getRequestPath(event: H3Event): string {
  const path = (getUrlPath(event) || "/").replace(DOUBLE_SLASH_RE, "/");
  return path;
}
