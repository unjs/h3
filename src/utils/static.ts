import type { H3Event } from "../types";
import {
  decodePath,
  parseURL,
  withLeadingSlash,
  withoutTrailingSlash,
} from "ufo";
import { createError } from "../error";
import { send, isStream, sendStream } from "./response";

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
  getContents: (id: string) => unknown | Promise<unknown>;

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
    event._raw.getHeader("accept-encoding") || "",
    options.encodings,
  );

  if (acceptEncodings.length > 1) {
    event._raw.setResponseHeader("vary", "accept-encoding");
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

  if (meta.etag && !event._raw.getResponseHeader("etag")) {
    event._raw.setResponseHeader("etag", meta.etag);
  }

  const ifNotMatch =
    meta.etag && event._raw.getHeader("if-none-match") === meta.etag;
  if (ifNotMatch) {
    event._raw.responseCode = 304;
    event._raw.responseMessage = "Not Modified";
    return send(event, "");
  }

  if (meta.mtime) {
    const mtimeDate = new Date(meta.mtime);

    const ifModifiedSinceH = event._raw.getHeader("if-modified-since");
    if (ifModifiedSinceH && new Date(ifModifiedSinceH) >= mtimeDate) {
      event._raw.responseCode = 304;
      event._raw.responseMessage = "Not Modified";
      return send(event, null);
    }

    if (!event._raw.getResponseHeader("last-modified")) {
      event._raw.setResponseHeader("last-modified", mtimeDate.toUTCString());
    }
  }

  if (meta.type && !event._raw.getResponseHeader("content-type")) {
    event._raw.setResponseHeader("content-type", meta.type);
  }

  if (meta.encoding && !event._raw.getResponseHeader("content-encoding")) {
    event._raw.setResponseHeader("content-encoding", meta.encoding);
  }

  if (
    meta.size !== undefined &&
    meta.size > 0 &&
    !event._raw.getResponseHeader("content-length")
  ) {
    event._raw.setResponseHeader("content-length", meta.size + "");
  }

  if (event.method === "HEAD") {
    return send(event, null);
  }

  const contents = await options.getContents(id);
  return isStream(contents)
    ? sendStream(event, contents)
    : send(event, contents);
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
