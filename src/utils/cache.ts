import type { CacheConditions, H3Event } from "../types";
import { _kRaw } from "../event";

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
    const ifModifiedSince = event[_kRaw].getHeader("if-modified-since");
    event[_kRaw].setResponseHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= opts.modifiedTime) {
      cacheMatched = true;
    }
  }

  if (opts.etag) {
    event[_kRaw].setResponseHeader("etag", opts.etag);
    const ifNonMatch = event[_kRaw].getHeader("if-none-match");
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }

  event[_kRaw].setResponseHeader("cache-control", cacheControls.join(", "));

  if (cacheMatched) {
    event[_kRaw].responseCode = 304;
    return true;
  }

  return false;
}
