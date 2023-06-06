import type { H3Event } from "../event";
import { getRequestRawHeader, setResponseHeader } from "./headers";

export interface CacheConditions {
  modifiedTime?: string | Date;
  maxAge?: number;
  etag?: string;
  cacheControls?: string[];
}

/**
 * Check request caching headers (`If-Modified-Since`) and add caching headers (Last-Modified, Cache-Control)
 * Note: `public` cache control will be added by default
 * @returns `true` when cache headers are matching. When `true` is returned, no reponse should be sent anymore
 */
export function handleCacheHeaders(
  event: H3Event,
  opts: CacheConditions
): boolean {
  const cacheControls = ["public", ...(opts.cacheControls || [])];
  let cacheMatched = false;

  if (opts.maxAge !== undefined) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }

  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = getRequestRawHeader(event, "if-modified-since");
    setResponseHeader(event, "last-modified", modifiedTime.toUTCString());
    if (
      ifModifiedSince &&
      !Array.isArray(ifModifiedSince) &&
      new Date(ifModifiedSince) >= opts.modifiedTime
    ) {
      cacheMatched = true;
    }
  }

  if (opts.etag) {
    setResponseHeader(event, "etag", opts.etag);
    const ifNonMatch = getRequestRawHeader(event, "if-none-match");
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }

  setResponseHeader(event, "cache-control", cacheControls.join(", "));

  if (cacheMatched) {
    event.node.res.statusCode = 304;
    event.node.res.end();
    return true;
  }

  return false;
}
