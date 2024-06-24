import type { H3Event } from "../types";
import type { H3CorsOptions } from "../types/utils/cors";
import { _kRaw } from "../event";
import { sendNoContent, appendResponseHeaders } from "./response";
import {
  createAllowHeaderHeaders,
  createCredentialsHeaders,
  createExposeHeaders,
  createMethodsHeaders,
  createOriginHeaders,
  resolveCorsOptions,
} from "./internal/cors";
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
