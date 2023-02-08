import { defu } from "defu";
import { appendHeaders } from "../response";
import { getMethod, getRequestHeaders, getRequestHeader } from "../request";
import type { H3Event } from "../../event";
import type {
  CorsOptions,
  ResolvedCorsOptions,
  AccessControlAllowOriginHeader,
  AccessControlAllowMethodsHeader,
  AccessControlAllowCredentialsHeader,
  AccessControlAllowHeadersHeader,
  AccessControlExposeHeadersHeader,
  AccessControlMaxAgeHeader,
} from "./types";

export function resolveCorsOptions(
  options: CorsOptions = {}
): ResolvedCorsOptions {
  const defaultOptions: ResolvedCorsOptions = {
    origin: "*",
    methods: "*",
    allowHeaders: "*",
    exposeHeaders: "*",
    credentials: false,
    maxAge: false,
    preflight: {
      statusCode: 204,
    },
  };

  return defu(options, defaultOptions);
}

export function isPreflight(event: H3Event): boolean {
  const method = getMethod(event);
  const origin = getRequestHeader(event, "origin");
  const accessControlRequestMethod = getRequestHeader(
    event,
    "access-control-request-method"
  );

  return method === "OPTIONS" && !!origin && !!accessControlRequestMethod;
}

export function isAllowedOrigin(
  origin: ReturnType<typeof getRequestHeaders>["origin"],
  options: CorsOptions
): boolean {
  const { origin: originOption } = options;

  if (
    !origin ||
    !originOption ||
    originOption === "*" ||
    originOption === "null"
  ) {
    return true;
  }

  if (Array.isArray(originOption)) {
    return originOption.some((_origin) => {
      if (_origin instanceof RegExp) {
        return _origin.test(origin);
      }

      return origin === _origin;
    });
  }

  return originOption(origin);
}

export function createOriginHeaders(
  event: H3Event,
  options: CorsOptions
): AccessControlAllowOriginHeader {
  const { origin: originOption } = options;
  const origin = getRequestHeader(event, "Origin");

  if (!origin || !originOption || originOption === "*") {
    return { "Access-Control-Allow-Origin": "*" };
  }

  if (typeof originOption === "string") {
    return { "Access-Control-Allow-Origin": originOption, Vary: "Origin" };
  }

  return isAllowedOrigin(origin, options)
    ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
    : {};
}

export function createMethodsHeaders(
  options: CorsOptions
): AccessControlAllowMethodsHeader {
  const { methods } = options;

  if (!methods) {
    return {};
  }

  if (methods === "*") {
    return { "Access-Control-Allow-Methods": "*" };
  }

  return methods.length > 0
    ? { "Access-Control-Allow-Methods": methods.join(",") }
    : {};
}

export function createCredentialsHeaders(
  options: CorsOptions
): AccessControlAllowCredentialsHeader {
  const { credentials } = options;

  if (credentials) {
    return { "Access-Control-Allow-Credentials": "true" };
  }

  return {};
}

export function createAllowHeaderHeaders(
  event: H3Event,
  options: CorsOptions
): AccessControlAllowHeadersHeader {
  const { allowHeaders } = options;

  if (!allowHeaders || allowHeaders === "*" || allowHeaders.length === 0) {
    const header = getRequestHeader(event, "access-control-request-headers");

    return header
      ? {
          "Access-Control-Allow-Headers": header,
          Vary: "Access-Control-Request-Headers",
        }
      : {};
  }

  return {
    "Access-Control-Allow-Headers": allowHeaders.join(","),
    Vary: "Access-Control-Request-Headers",
  };
}

export function createExposeHeaders(
  options: CorsOptions
): AccessControlExposeHeadersHeader {
  const { exposeHeaders } = options;

  if (!exposeHeaders) {
    return {};
  }

  if (exposeHeaders === "*") {
    return { "Access-Control-Expose-Headers": exposeHeaders };
  }

  return { "Access-Control-Expose-Headers": exposeHeaders.join(",") };
}

export function createMaxAgeHeader(
  options: CorsOptions
): AccessControlMaxAgeHeader {
  const { maxAge } = options;

  if (maxAge) {
    return { "Access-Control-Max-Age": maxAge };
  }

  return {};
}

// TODO: Implemente e2e tests to improve code coverage
/* c8 ignore start */
export function appendCorsPreflightHeaders(
  event: H3Event,
  options: CorsOptions
) {
  appendHeaders(event, createOriginHeaders(event, options));
  appendHeaders(event, createCredentialsHeaders(options));
  appendHeaders(event, createExposeHeaders(options));
  appendHeaders(event, createMethodsHeaders(options));
  appendHeaders(event, createAllowHeaderHeaders(event, options));
}
/* c8 ignore end */

// TODO: Implemente e2e tests to improve code coverage
/* c8 ignore start */
export function appendCorsActualRequestHeaders(
  event: H3Event,
  options: CorsOptions
) {
  appendHeaders(event, createOriginHeaders(event, options));
  appendHeaders(event, createCredentialsHeaders(options));
  appendHeaders(event, createExposeHeaders(options));
}
/* c8 ignore end */
