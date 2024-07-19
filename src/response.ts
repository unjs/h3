import type { H3Config, H3Event } from "./types";
import type { H3Error, PreparedResponse } from "./types/h3";
import { createError } from "./error";
import { isJSONSerializable } from "./utils/internal/object";

export const kNotFound = Symbol.for("h3.notFound");

export function prepareResponse(
  val: unknown,
  event: H3Event,
  config: H3Config,
): PreparedResponse {
  const body = prepareResponseBody(val, event, config);
  const status = event.response.status;
  const isNullBody =
    (status &&
      (status === 100 ||
        status === 101 ||
        status === 102 ||
        status === 204 ||
        status === 205 ||
        status === 304)) ||
    event.method === "HEAD";

  return {
    body: isNullBody ? null : body,
    status,
    statusText: event.response.statusText,
    headers:
      event.response._headers ||
      event.response._headersInit ||
      event.response.headers,
  };
}

export function prepareResponseBody(
  val: unknown,
  event: H3Event,
  config: H3Config,
): BodyInit | null | undefined {
  // Empty Content
  if (val === null || val === undefined) {
    return "";
  }

  // Not found
  if (val === kNotFound) {
    return prepareErrorResponseBody(
      {
        statusCode: 404,
        statusMessage: `Cannot find any route matching [${event.request.method}] ${event.path}`,
      },
      event,
      config,
    );
  }

  const valType = typeof val;

  // Text
  if (valType === "string") {
    return val as string;
  }

  // Buffer (should be before JSON)
  if (val instanceof Uint8Array) {
    event.response.setHeader("content-type", "application/octet-stream");
    event.response.setHeader("content-length", val.byteLength.toString());
    return val;
  }

  // Error (should be before JSON)
  if (val instanceof Error) {
    return prepareErrorResponseBody(val, event, config);
  }

  // JSON
  if (isJSONSerializable(val, valType)) {
    event.response.setHeader("content-type", "application/json; charset=utf-8");
    return JSON.stringify(val, undefined, config.debug ? 2 : undefined);
  }

  // BigInt
  if (valType === "bigint") {
    event.response.setHeader("content-type", "application/json; charset=utf-8");
    return val.toString();
  }

  // Web Response
  if (val instanceof Response) {
    event.response.status = val.status;
    event.response.statusText = val.statusText;
    for (const [name, value] of val.headers) {
      event.response.setHeader(name, value);
    }
    return val.body;
  }

  // Blob
  if (val instanceof Blob) {
    event.response.setHeader("content-type", val.type);
    event.response.setHeader("content-length", val.size.toString());
    return val.stream();
  }

  // Symbol or Function is not supported
  if (valType === "symbol" || valType === "function") {
    return prepareErrorResponseBody(
      {
        statusCode: 500,
        statusMessage: `[h3] Cannot send ${valType} as response.`,
      },
      event,
      config,
    );
  }

  return val as BodyInit;
}

export function prepareErrorResponseBody(
  val: Partial<H3Error> | Error,
  event: H3Event,
  config: H3Config,
): string {
  const error = createError(val as H3Error);
  event.response.status = error.statusCode;
  event.response.statusText = error.statusMessage;
  event.response.setHeader("content-type", "application/json; charset=utf-8");
  return JSON.stringify({
    statusCode: error.statusCode,
    statusMessage: error.statusMessage,
    data: error.data,
    stack:
      config.debug && error.stack
        ? error.stack.split("\n").map((l) => l.trim())
        : undefined,
  });
}
