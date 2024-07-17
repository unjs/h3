import type { H3Config, H3Event, ResponseBody } from "./types";
import type { H3Response, H3Error } from "./types/h3";
import { createError } from "./error";
import { isJSONSerializable } from "./utils/internal/object";
import { MIMES } from "./utils/internal/consts";

export const kNotFound = Symbol.for("h3.notFound");

export function prepareResponse(
  event: H3Event,
  body: unknown,
  config: H3Config,
): ResponseBody | Promise<ResponseBody> {
  const res: H3Response = normalizeResponseBody(event, body, config);

  const status = event.response.status;
  if (
    status === 100 ||
    status === 101 ||
    status === 102 ||
    status === 204 ||
    status === 205 ||
    status === 304 ||
    event.method === "HEAD"
  ) {
    res.body = null;
  }

  if (res.contentType && !event.response.headers.has("content-type")) {
    event.response.headers.set("content-type", res.contentType);
  }

  if (res.headers) {
    for (const [key, value] of res.headers.entries()) {
      event.response.headers.set(key, value);
    }
  }

  if (res.status) {
    event.response.status = res.status;
  }

  if (res.statusText) {
    event.response.statusText = res.statusText;
  }

  let promise: Promise<unknown> | undefined;

  if (res.error) {
    if (res.error.unhandled) {
      console.error("[h3] Unhandled Error:", res.error);
    }
    if (config.onError) {
      try {
        promise = Promise.resolve(config.onError(res.error, event));
      } catch (hookError) {
        console.error("[h3] Error while calling `onError` hook:", hookError);
      }
    }
  }

  if (config.onBeforeResponse) {
    promise = (promise || Promise.resolve()).then(() =>
      config.onBeforeResponse!(event, res),
    );
  }

  return promise ? promise.then(() => res.body) : res.body;
}

function normalizeResponseBody(
  event: H3Event,
  val: unknown,
  config: H3Config,
): H3Response {
  // Empty Content
  if (val === null || val === undefined) {
    return { body: "" };
  }

  // Not found
  if (val === kNotFound) {
    return errorToH3Response(
      {
        statusCode: 404,
        statusMessage: `Cannot find any route matching [${event.request.method}] ${event.path}`,
      },
      config,
    );
  }

  const valType = typeof val;

  // Text
  if (valType === "string") {
    return { body: val as string, contentType: MIMES.html };
  }

  // Buffer (should be before JSON)
  if (val instanceof Uint8Array) {
    return { body: val, contentType: MIMES.octetStream };
  }

  // Error (should be before JSON)
  if (val instanceof Error) {
    return errorToH3Response(val, config);
  }

  // JSON
  if (isJSONSerializable(val, valType)) {
    return {
      body: JSON.stringify(val, undefined, config.debug ? 2 : undefined),
      contentType: MIMES.json,
    };
  }

  // BigInt
  if (valType === "bigint") {
    return { body: val.toString(), contentType: MIMES.json };
  }

  // Web Response
  if (val instanceof Response) {
    return {
      body: val.body,
      headers: val.headers,
      status: val.status,
      statusText: val.statusText,
    };
  }

  // Blob
  if (val instanceof Blob) {
    return {
      contentType: val.type,
      body: val.stream(),
    };
  }

  // Symbol or Function is not supported
  if (valType === "symbol" || valType === "function") {
    return errorToH3Response(
      {
        statusCode: 500,
        statusMessage: `[h3] Cannot send ${valType} as response.`,
      },
      config,
    );
  }

  return {
    body: val as ResponseBody,
  };
}

export function errorToH3Response(
  _error: Partial<H3Error> | Error,
  config: H3Config,
): H3Response {
  const error = createError(_error as H3Error);
  return {
    error,
    status: error.statusCode,
    statusText: error.statusMessage,
    contentType: MIMES.json,
    body: JSON.stringify({
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data,
      stack:
        config.debug && error.stack
          ? error.stack.split("\n").map((l) => l.trim())
          : undefined,
    }),
  };
}
