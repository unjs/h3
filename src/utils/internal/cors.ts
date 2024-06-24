import type { H3Event } from "../../types";
import type {
  H3CorsOptions,
  H3ResolvedCorsOptions,
  H3AccessControlAllowOriginHeader,
  H3AccessControlAllowMethodsHeader,
  H3AccessControlAllowCredentialsHeader,
  H3AccessControlAllowHeadersHeader,
  H3AccessControlExposeHeadersHeader,
  H3AccessControlMaxAgeHeader,
} from "../../types/utils/cors";
import { _kRaw } from "../../event";
import { appendResponseHeaders, sendNoContent } from "../response";

/**
 * Resolve CORS options.
 */
export function resolveCorsOptions(
  options: H3CorsOptions = {},
): H3ResolvedCorsOptions {
  const defaultOptions: H3ResolvedCorsOptions = {
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

  return {
    ...defaultOptions,
    ...options,
    preflight: {
      ...defaultOptions.preflight,
      ...options.preflight,
    },
  };
}

/**
 * Check if the incoming request is a CORS preflight request.
 */
export function isPreflightRequest(event: H3Event): boolean {
  const origin = event[_kRaw].getHeader("origin");
  const accessControlRequestMethod = event[_kRaw].getHeader(
    "access-control-request-method",
  );

  return event.method === "OPTIONS" && !!origin && !!accessControlRequestMethod;
}

/**
 * Check if the incoming request is a CORS request.
 */
export function isCorsOriginAllowed(
  origin: string | undefined,
  options: H3CorsOptions,
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

/**
 * Create the `access-control-allow-origin` header.
 */
export function createOriginHeaders(
  event: H3Event,
  options: H3CorsOptions,
): H3AccessControlAllowOriginHeader {
  const { origin: originOption } = options;
  const origin = event[_kRaw].getHeader("origin");

  if (!origin || !originOption || originOption === "*") {
    return { "access-control-allow-origin": "*" };
  }

  if (typeof originOption === "string") {
    return { "access-control-allow-origin": originOption, vary: "origin" };
  }

  return isCorsOriginAllowed(origin, options)
    ? { "access-control-allow-origin": origin, vary: "origin" }
    : {};
}

/**
 * Create the `access-control-allow-methods` header.
 */
export function createMethodsHeaders(
  options: H3CorsOptions,
): H3AccessControlAllowMethodsHeader {
  const { methods } = options;

  if (!methods) {
    return {};
  }

  if (methods === "*") {
    return { "access-control-allow-methods": "*" };
  }

  return methods.length > 0
    ? { "access-control-allow-methods": methods.join(",") }
    : {};
}

/**
 * Create the `access-control-allow-credentials` header.
 */
export function createCredentialsHeaders(
  options: H3CorsOptions,
): H3AccessControlAllowCredentialsHeader {
  const { credentials } = options;

  if (credentials) {
    return { "access-control-allow-credentials": "true" };
  }

  return {};
}

/**
 * Create the `access-control-allow-headers` and `vary` headers.
 */
export function createAllowHeaderHeaders(
  event: H3Event,
  options: H3CorsOptions,
): H3AccessControlAllowHeadersHeader {
  const { allowHeaders } = options;

  if (!allowHeaders || allowHeaders === "*" || allowHeaders.length === 0) {
    const header = event[_kRaw].getHeader("access-control-request-headers");

    return header
      ? {
          "access-control-allow-headers": header,
          vary: "access-control-request-headers",
        }
      : {};
  }

  return {
    "access-control-allow-headers": allowHeaders.join(","),
    vary: "access-control-request-headers",
  };
}

/**
 * Create the `access-control-expose-headers` header.
 */
export function createExposeHeaders(
  options: H3CorsOptions,
): H3AccessControlExposeHeadersHeader {
  const { exposeHeaders } = options;

  if (!exposeHeaders) {
    return {};
  }

  if (exposeHeaders === "*") {
    return { "access-control-expose-headers": exposeHeaders };
  }

  return { "access-control-expose-headers": exposeHeaders.join(",") };
}

/**
 * Create the `access-control-max-age` header.
 */
export function createMaxAgeHeader(
  options: H3CorsOptions,
): H3AccessControlMaxAgeHeader {
  const { maxAge } = options;

  if (maxAge) {
    return { "access-control-max-age": maxAge };
  }

  return {};
}

/**
 * Append CORS preflight headers to the response.
 */
export function appendCorsPreflightHeaders(
  event: H3Event,
  options: H3CorsOptions,
) {
  appendResponseHeaders(event, createOriginHeaders(event, options));
  appendResponseHeaders(event, createCredentialsHeaders(options));
  appendResponseHeaders(event, createExposeHeaders(options));
  appendResponseHeaders(event, createMethodsHeaders(options));
  appendResponseHeaders(event, createAllowHeaderHeaders(event, options));
}

/**
 * Append CORS headers to the response.
 */
export function appendCorsHeaders(event: H3Event, options: H3CorsOptions) {
  appendResponseHeaders(event, createOriginHeaders(event, options));
  appendResponseHeaders(event, createCredentialsHeaders(options));
  appendResponseHeaders(event, createExposeHeaders(options));
}

/**
 * Handle CORS for the incoming request.
 *
 * If the incoming request is a CORS preflight request, it will append the CORS preflight headers and send a 204 response.
 *
 * If return value is `true`, the request is handled and no further action is needed.
 *
 * @example
 * const app = createApp();
 * const router = createRouter();
 * router.use('/',
 *   defineEventHandler(async (event) => {
 *       const didHandleCors = handleCors(event, {
 *         origin: '*',
 *         preflight: {
 *          statusCode: 204,
 *         },
 *      methods: '*',
 *    });
 *    if (didHandleCors) {
 *      return;
 *    }
 *    // Your code here
 *  })
 * );
 */
export function handleCors(event: H3Event, options: H3CorsOptions): boolean {
  const _options = resolveCorsOptions(options);
  if (isPreflightRequest(event)) {
    appendCorsPreflightHeaders(event, options);
    sendNoContent(event, _options.preflight.statusCode);
    return true;
  }
  appendCorsHeaders(event, options);
  return false;
}
