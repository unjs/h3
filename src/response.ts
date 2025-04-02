import type { H3Config, H3Event } from "./types";
import type { H3Error } from "./types/h3";
import { Response as SrvxResponse } from "srvx";
import { createError } from "./error";
import { isJSONSerializable } from "./utils/internal/object";

export const kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");
export const kHandled = /* @__PURE__ */ Symbol.for("h3.handled");

export function handleResponse(
  val: unknown,
  event: H3Event,
  config: H3Config,
): Response | Promise<Response> {
  if (val && val instanceof Promise) {
    return val
      .catch((error) => error)
      .then((resolvedVal) => handleResponse(resolvedVal, event, config));
  }

  const response =
    handleError(val, event, config) || prepareResponse(val, event, config);

  if (response instanceof Promise) {
    return handleResponse(response, event, config);
  }

  const { onBeforeResponse } = config;
  return onBeforeResponse
    ? Promise.resolve(onBeforeResponse(event, response)).then(() => response)
    : response;
}

function handleError(
  val: unknown,
  event: H3Event,
  config: H3Config,
  nested?: boolean,
): Response | Promise<Response | undefined> | undefined {
  if (val === kNotFound) {
    val = createError({
      statusCode: 404,
      statusMessage: `Cannot find any route matching [${event.req.method}] ${event.url}`,
    });
  }
  if (!val || !(val instanceof Error)) {
    return undefined;
  }
  const error = createError(val);
  const { onError } = config;
  return onError && !nested
    ? Promise.resolve(onError(error, event))
        .catch((error) => error)
        .then((newVal) => handleError(newVal ?? val, event, config, true))
    : errorResponse(error, config.debug);
}

function prepareResponse(
  res: unknown,
  event: H3Event,
  config: H3Config,
): Response {
  if (res === kHandled) {
    return new SrvxResponse(null);
  }

  if (!(res instanceof Response)) {
    const body = prepareResponseBody(res, event, config); // side effect: might set headers
    const status = event.res.status;
    return new SrvxResponse(nullBody(event.req.method, status) ? null : body, {
      status,
      statusText: event.res.statusText,
      headers: (event.res as { _headers?: Headers })._headers,
    });
  }

  // Note: preparted status and statusText are discarded in favor of response values we only check _headers
  const preparedHeaders = (event.res as { _headers?: Headers })._headers;
  if (!preparedHeaders) {
    return res;
  }
  // Slow path: merge headers
  const mergedHeaders = new Headers(preparedHeaders);
  for (const [name, value] of res.headers) {
    if (name === "set-cookie") {
      mergedHeaders.append(name, value);
    } else {
      mergedHeaders.set(name, value);
    }
  }
  return new SrvxResponse(
    nullBody(event.req.method, res.status) ? null : res.body,
    {
      status: res.status,
      statusText: res.statusText,
      headers: mergedHeaders,
    },
  ) as Response;
}

function prepareResponseBody(
  val: unknown,
  event: H3Event,
  config: H3Config,
): BodyInit | null | undefined {
  // Empty Content
  if (val === null || val === undefined) {
    return "";
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

  // Symbol or Function is not supported, return a hint
  if (valType === "symbol" || valType === "function") {
    return `{ _${valType}: {} }`;
  }

  return val as BodyInit;
}

function nullBody(
  method: string,
  status: number | undefined,
): boolean | 0 | undefined {
  // prettier-ignore
  return (method === "HEAD" ||
    status === 100 || status === 101 || status === 102 ||
    status === 204 || status === 205 || status === 304
  )
}

function errorResponse(error: H3Error, debug?: boolean): Response {
  return new SrvxResponse(
    JSON.stringify(
      {
        statusCode: error.statusCode,
        statusMessage: error.statusMessage,
        data: error.data,
        stack:
          debug && error.stack
            ? error.stack.split("\n").map((l) => l.trim())
            : undefined,
      },
      null,
      2,
    ),
    {
      status: error.statusCode,
      statusText: error.statusMessage,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}
