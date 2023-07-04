import { getRequestRawHeader } from "./header";
import { H3Event } from "src/event";

export function setOriginalUrlPath(event: H3Event, url: string) {
  // eslint-disable-next-line @typescript-eslint/no-extra-semi
  (event.node.req as any).originalUrlPath = url;
}

export function getOriginalUrlPath(event: H3Event) {
  return (event.node.req as any).originalUrlPath as string;
}

export function setUrlPath(event: H3Event, url: string) {
  event.node.req.url = url;
}

export function getUrlPath(event: H3Event) {
  return event.node.req.url || "/";
}

export function getRequestURL(
  event: H3Event,
  opts: { xForwardedHost?: boolean; xForwardedProto?: boolean } = {}
) {
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
  return (event.node.req.connection as any).encrypted ? "https" : "http";
}

const DOUBLE_SLASH_RE = /[/\\]{2,}/g;

export function getRequestPath(event: H3Event): string {
  const path = (getUrlPath(event) || "/").replace(DOUBLE_SLASH_RE, "/");
  return path;
}
