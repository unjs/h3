import type { H3Config, H3Event } from "./types";
import type { H3Error, PreparedResponse } from "./types/h3";
import type { WebEvent } from "./adapters/web/event";
import { createError } from "./error";
import { isJSONSerializable } from "./utils/internal/object";

export const kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");

export function prepareResponse<T extends boolean = false>(
  val: unknown,
  event: H3Event,
  config: H3Config,
  web?: T,
): T extends true ? Response : PreparedResponse {
  const isHead = event.method === "HEAD";

  if (web && val instanceof Response) {
    const we = event as WebEvent;
    const status = we.response.status;
    const statusText = we.response.statusText;
    const headers = we.response._headers || we.response._headersInit;
    if (!status && !statusText && !headers) {
      return val;
    }
    return new Response(isHead || isNullStatus(status) ? null : val.body, {
      status: status || val.status,
      statusText: statusText || val.statusText,
      headers: headers || val.headers,
    });
  }

  // We always prepare response body to resolve status and headers
  const body = prepareResponseBody(val, event, config);
  const status = event.response.status;
  const responseInit: PreparedResponse = {
    body: isHead || isNullStatus(status) ? null : body,
    status,
    statusText: event.response.statusText,
    headers:
      event.response._headers ||
      event.response._headersInit ||
      event.response.headers,
  };

  if (web) {
    return new Response(responseInit.body, responseInit);
  }

  return responseInit as Response;
}

function isNullStatus(status?: number) {
  return (
    status &&
    (status === 100 ||
      status === 101 ||
      status === 102 ||
      status === 204 ||
      status === 205 ||
      status === 304)
  );
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
