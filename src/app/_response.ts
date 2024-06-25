import type { AppOptions, H3Event, ResponseBody } from "../types";
import type { AppResponse, H3Error } from "../types/app";
import { createError } from "../error";
import { isJSONSerializable } from "../utils/internal/object";
import { MIMES } from "../utils/internal/consts";
import { _kRaw } from "../event";

type MaybePromise<T> = T | Promise<T>;

export async function handleAppResponse(
  event: H3Event,
  body: unknown,
  options: AppOptions,
) {
  const res = await _normalizeResponseBody(body, options);
  if (res.error) {
    if (res.error.unhandled) {
      console.error("[h3] Unhandled Error:", res.error);
    }
    if (options.onError) {
      try {
        await options.onError(res.error, event);
      } catch (hookError) {
        console.error("[h3] Error while calling `onError` hook:", hookError);
      }
    }
  }
  if (options.onBeforeResponse) {
    await options.onBeforeResponse(event, res);
  }
  if (res.contentType && !event[_kRaw].getResponseHeader("content-type")) {
    event[_kRaw].setResponseHeader("content-type", res.contentType);
  }
  if (res.headers) {
    for (const [key, value] of res.headers.entries()) {
      event[_kRaw].setResponseHeader(key, value);
    }
  }
  if (res.status) {
    event[_kRaw].responseCode = res.status;
  }
  if (res.statusText) {
    event[_kRaw].responseMessage = res.statusText;
  }
  return res.body;
}

function _normalizeResponseBody(
  val: unknown,
  options: AppOptions,
): MaybePromise<AppResponse> {
  // Empty Content
  if (val === null || val === undefined) {
    return { body: "", status: 204 };
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
    return errorToAppResponse(val, options);
  }

  // JSON
  if (isJSONSerializable(val, valType)) {
    return {
      body: JSON.stringify(val, undefined, options.debug ? 2 : undefined),
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
    return val.arrayBuffer().then((arrayBuffer) => {
      return {
        contentType: val.type,
        body: new Uint8Array(arrayBuffer),
      };
    });
  }

  // Symbol or Function is not supported
  if (valType === "symbol" || valType === "function") {
    return errorToAppResponse(
      {
        statusCode: 500,
        statusMessage: `[h3] Cannot send ${valType} as response.`,
      },
      options,
    );
  }

  return {
    body: val as ResponseBody,
  };
}

export function errorToAppResponse(
  _error: Partial<H3Error> | Error,
  options: AppOptions,
): AppResponse {
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
        options.debug && error.stack
          ? error.stack.split("\n").map((l) => l.trim())
          : undefined,
    }),
  };
}
