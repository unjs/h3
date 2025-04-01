import type { H3Config, H3Event } from "./types";
import type { H3Error, PreparedResponse } from "./types/h3";
import { Response as SrvxResponse } from "srvx";
import { createError } from "./error";
import { isJSONSerializable } from "./utils/internal/object";

export const kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");
export const kHandled = /* @__PURE__ */ Symbol.for("h3.handled");

export function prepareResponse(
  val: unknown,
  event: H3Event,
  config: H3Config,
): Response {
  if (val === kHandled) {
    return new Response(null);
  }

  if (val instanceof Response) {
    // Note: preparted status and statusText are discarded in favor of response values
    const preparedHeaders = event.res._headers || event.res._headersInit;
    if (!preparedHeaders) {
      return val;
    }
    // Slow path: merge headers
    const noBody = event.method === "HEAD" || isNullStatus(val.status);
    const mergedHeaders = new Headers(preparedHeaders);
    for (const [name, value] of val.headers) {
      if (name === "set-cookie") {
        mergedHeaders.append(name, value);
      } else {
        mergedHeaders.set(name, value);
      }
    }
    return new SrvxResponse(noBody ? null : val.body, {
      status: val.status,
      statusText: val.statusText,
      headers: mergedHeaders,
    }) as Response;
  }

  // We always prepare response body to resolve status and headers
  const body = prepareResponseBody(val, event, config);
  const status = event.res.status;
  const responseInit: PreparedResponse = {
    body: event.method === "HEAD" || isNullStatus(status) ? null : body,
    status,
    statusText: event.res.statusText,
    headers: event.res._headers || event.res._headersInit,
  };

  return new SrvxResponse(responseInit.body, responseInit) as Response;
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
        statusMessage: `Cannot find any route matching [${event.req.method}] ${event.path}`,
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
    event.res.headers.set("content-length", val.byteLength.toString());
    return val;
  }

  // Error (should be before JSON)
  if (val instanceof Error) {
    return prepareErrorResponseBody(val, event, config);
  }

  // JSON
  if (isJSONSerializable(val, valType)) {
    event.res.headers.set("content-type", "application/json; charset=utf-8");
    return JSON.stringify(val, undefined, config.debug ? 2 : undefined);
  }

  // BigInt
  if (valType === "bigint") {
    event.res.headers.set("content-type", "application/json; charset=utf-8");
    return val.toString();
  }

  // Web Response
  if (val instanceof Response) {
    event.res.status = val.status;
    event.res.statusText = val.statusText;
    for (const [name, value] of val.headers) {
      event.res.headers.set(name, value);
    }
    return val.body;
  }

  // Blob
  if (val instanceof Blob) {
    event.res.headers.set("content-type", val.type);
    event.res.headers.set("content-length", val.size.toString());
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
  event.res.status = error.statusCode;
  event.res.statusText = error.statusMessage;
  event.res.headers.set("content-type", "application/json; charset=utf-8");
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
