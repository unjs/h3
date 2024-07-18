import type { CacheConditions, H3Event } from "../types";

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
    const ifModifiedSince = event.request.headers.get("if-modified-since");
    event.response.headers.set("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= opts.modifiedTime) {
      cacheMatched = true;
    }
  }

  if (opts.etag) {
    event.response.headers.set("etag", opts.etag);
    const ifNonMatch = event.request.headers.get("if-none-match");
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }

  event.response.headers.set("cache-control", cacheControls.join(", "));

  if (cacheMatched) {
    event.response.status = 304;
    return true;
  }

  return false;
}
