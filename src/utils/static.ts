import type { H3Event, StaticAssetMeta, ServeStaticOptions } from "../types";
import { createError } from "../error";
import {
  withLeadingSlash,
  withoutTrailingSlash,
  getPathname,
} from "./internal/path";

/**
 * Dynamically serve static assets based on the request path.
 */
export async function serveStatic(
  event: H3Event,
  options: ServeStaticOptions,
): Promise<false | undefined | null | BodyInit> {
  if (event.request.method !== "GET" && event.request.method !== "HEAD") {
    if (!options.fallthrough) {
      throw createError({
        statusMessage: "Method Not Allowed",
        statusCode: 405,
      });
    }
    return false;
  }

  const originalId = decodeURI(
    withLeadingSlash(withoutTrailingSlash(getPathname(event.path))),
  );

  const acceptEncodings = parseAcceptEncoding(
    event.request.headers.get("accept-encoding") || "",
    options.encodings,
  );

  if (acceptEncodings.length > 1) {
    event.response.headers.set("vary", "accept-encoding");
  }

  let id = originalId;
  let meta: StaticAssetMeta | undefined;

  const _ids = idSearchPaths(
    originalId,
    acceptEncodings,
    options.indexNames || ["/index.html"],
  );

  for (const _id of _ids) {
    const _meta = await options.getMeta(_id);
    if (_meta) {
      meta = _meta;
      id = _id;
      break;
    }
  }

  if (!meta) {
    if (!options.fallthrough) {
      throw createError({
        statusMessage: "Cannot find static asset " + id,
        statusCode: 404,
      });
    }
    return false;
  }

  if (meta.etag && !event.response.headers.has("etag")) {
    event.response.headers.set("etag", meta.etag);
  }

  const ifNotMatch =
    meta.etag && event.request.headers.get("if-none-match") === meta.etag;
  if (ifNotMatch) {
    event.response.status = 304;
    event.response.statusText = "Not Modified";
    return "";
  }

  if (meta.mtime) {
    const mtimeDate = new Date(meta.mtime);

    const ifModifiedSinceH = event.request.headers.get("if-modified-since");
    if (ifModifiedSinceH && new Date(ifModifiedSinceH) >= mtimeDate) {
      event.response.status = 304;
      event.response.statusText = "Not Modified";
      return "";
    }

    if (!event.response.headers.get("last-modified")) {
      event.response.headers.set("last-modified", mtimeDate.toUTCString());
    }
  }

  if (meta.type && !event.response.headers.get("content-type")) {
    event.response.headers.set("content-type", meta.type);
  }

  if (meta.encoding && !event.response.headers.get("content-encoding")) {
    event.response.headers.set("content-encoding", meta.encoding);
  }

  if (
    meta.size !== undefined &&
    meta.size > 0 &&
    !event.request.headers.get("content-length")
  ) {
    event.response.headers.set("content-length", meta.size + "");
  }

  if (event.request.method === "HEAD") {
    return "";
  }

  const contents = await options.getContents(id);
  return contents;
}

// --- Internal Utils ---

function parseAcceptEncoding(
  header?: string,
  encodingMap?: Record<string, string>,
): string[] {
  if (!encodingMap || !header) {
    return [];
  }
  return String(header || "")
    .split(",")
    .map((e) => encodingMap[e.trim()])
    .filter(Boolean);
}

function idSearchPaths(id: string, encodings: string[], indexNames: string[]) {
  const ids = [];

  for (const suffix of ["", ...indexNames]) {
    for (const encoding of [...encodings, ""]) {
      ids.push(`${id}${suffix}${encoding}`);
    }
  }

  return ids;
}
