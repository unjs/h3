import type { H3Event } from "../types";
import {
  decodePath,
  parseURL,
  withLeadingSlash,
  withoutTrailingSlash,
} from "ufo";
import { _kRaw } from "../event";
import { createError } from "../error";

export interface StaticAssetMeta {
  type?: string;
  etag?: string;
  mtime?: number | string | Date;
  path?: string;
  size?: number;
  encoding?: string;
}

export interface ServeStaticOptions {
  /**
   * This function should resolve asset meta
   */
  getMeta: (
    id: string,
  ) => StaticAssetMeta | undefined | Promise<StaticAssetMeta | undefined>;

  /**
   * This function should resolve asset content
   */
  getContents: (id: string) => any | Promise<any>;

  /**
   * Map of supported encodings (compressions) and their file extensions.
   *
   * Each extension will be appended to the asset path to find the compressed version of the asset.
   *
   * @example { gzip: ".gz", br: ".br" }
   */
  encodings?: Record<string, string>;

  /**
   * Default index file to serve when the path is a directory
   *
   * @default ["/index.html"]
   */
  indexNames?: string[];

  /**
   * When set to true, the function will not throw 404 error when the asset meta is not found or meta validation failed
   */
  fallthrough?: boolean;
}

/**
 * Dynamically serve static assets based on the request path.
 */
export async function serveStatic(
  event: H3Event,
  options: ServeStaticOptions,
): Promise<void | false> {
  if (event.method !== "GET" && event.method !== "HEAD") {
    if (!options.fallthrough) {
      throw createError({
        statusMessage: "Method Not Allowed",
        statusCode: 405,
      });
    }
    return false;
  }

  const originalId = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname)),
  );

  const acceptEncodings = parseAcceptEncoding(
    event[_kRaw].getHeader("accept-encoding") || "",
    options.encodings,
  );

  if (acceptEncodings.length > 1) {
    event[_kRaw].setResponseHeader("vary", "accept-encoding");
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

  if (meta.etag && !event[_kRaw].getResponseHeader("etag")) {
    event[_kRaw].setResponseHeader("etag", meta.etag);
  }

  const ifNotMatch =
    meta.etag && event[_kRaw].getHeader("if-none-match") === meta.etag;
  if (ifNotMatch) {
    event[_kRaw].responseCode = 304;
    event[_kRaw].responseMessage = "Not Modified";
    return event?.[_kRaw]?.sendResponse("");
  }

  if (meta.mtime) {
    const mtimeDate = new Date(meta.mtime);

    const ifModifiedSinceH = event[_kRaw].getHeader("if-modified-since");
    if (ifModifiedSinceH && new Date(ifModifiedSinceH) >= mtimeDate) {
      event[_kRaw].responseCode = 304;
      event[_kRaw].responseMessage = "Not Modified";
      return event?.[_kRaw]?.sendResponse("");
    }

    if (!event[_kRaw].getResponseHeader("last-modified")) {
      event[_kRaw].setResponseHeader("last-modified", mtimeDate.toUTCString());
    }
  }

  if (meta.type && !event[_kRaw].getResponseHeader("content-type")) {
    event[_kRaw].setResponseHeader("content-type", meta.type);
  }

  if (meta.encoding && !event[_kRaw].getResponseHeader("content-encoding")) {
    event[_kRaw].setResponseHeader("content-encoding", meta.encoding);
  }

  if (
    meta.size !== undefined &&
    meta.size > 0 &&
    !event[_kRaw].getResponseHeader("content-length")
  ) {
    event[_kRaw].setResponseHeader("content-length", meta.size + "");
  }

  if (event.method === "HEAD") {
    return event?.[_kRaw]?.sendResponse();
  }

  const contents = await options.getContents(id);
  return event?.[_kRaw]?.sendResponse(contents);
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
