import type { H3Event } from "../types";

export interface CacheConditions {
  modifiedTime?: string | Date;
  maxAge?: number;
  etag?: string;
  cacheControls?: string[];
}

/**
 * Check request caching headers (`If-Modified-Since`) and add caching headers (Last-Modified, Cache-Control)
 * Note: `public` cache control will be added by default
 * @returns `true` when cache headers are matching. When `true` is returned, no response should be sent anymore
 */
export function handleCacheHeaders(
  event: H3Event,
  opts: CacheConditions,
): boolean {
  const cacheControls = ["public", ...(opts.cacheControls || [])];
  let cacheMatched = false;

  if (opts.maxAge !== undefined) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }

  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event._raw.getResponseHeader("if-modified-since");
    event._raw.setResponseHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= opts.modifiedTime) {
      cacheMatched = true;
    }
  }

  if (opts.etag) {
    event._raw.setResponseHeader("etag", opts.etag);
    const ifNonMatch = event._raw.getResponseHeader("if-none-match");
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }

  event._raw.setResponseHeader("cache-control", cacheControls.join(", "));

  if (cacheMatched) {
    event._raw.responseCode = 304;
    if (!event._raw.handled) {
      event._raw.sendResponse();
    }
    return true;
  }

  return false;
}
