import type { H3Event } from "../types";
import type { H3CorsOptions } from "../types/utils/cors";
import { noContent } from "./response";
import {
  createAllowHeaderHeaders,
  createCredentialsHeaders,
  createExposeHeaders,
  createMaxAgeHeader,
  createMethodsHeaders,
  createOriginHeaders,
  resolveCorsOptions,
} from "./internal/cors";

export { isCorsOriginAllowed } from "./internal/cors";

/**
 * Check if the incoming request is a CORS preflight request.
 */
export function isPreflightRequest(event: H3Event): boolean {
  const origin = event.request.headers.get("origin");
  const accessControlRequestMethod = event.request.headers.get(
    "access-control-request-method",
  );

  return (
    event.request.method === "OPTIONS" &&
    !!origin &&
    !!accessControlRequestMethod
  );
}

/**
 * Append CORS preflight headers to the response.
 */
export function appendCorsPreflightHeaders(
  event: H3Event,
  options: H3CorsOptions,
) {
  const headers = {
    ...createOriginHeaders(event, options),
    ...createCredentialsHeaders(options),
    ...createMethodsHeaders(options),
    ...createAllowHeaderHeaders(event, options),
    ...createMaxAgeHeader(options),
  };
  for (const [key, value] of Object.entries(headers)) {
    event.response.headers.append(key, value);
  }
}

/**
 * Append CORS headers to the response.
 */
export function appendCorsHeaders(event: H3Event, options: H3CorsOptions) {
  const headers = {
    ...createOriginHeaders(event, options),
    ...createCredentialsHeaders(options),
    ...createExposeHeaders(options),
  };
  for (const [key, value] of Object.entries(headers)) {
    event.response.headers.append(key, value);
  }
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
 * router.use("/", async (event) => {
 *  const corsRes = handleCors(event, {
 *     origin: "*",
 *     preflight: {
 *       statusCode: 204,
 *     },
 *     methods: "*",
 *   });
 *   if (corsRes) {
 *     return corsRes;
 *   }
 *   // Your code here
 *  });
 * );
 */
export function handleCors(event: H3Event, options: H3CorsOptions): false | "" {
  const _options = resolveCorsOptions(options);
  if (isPreflightRequest(event)) {
    appendCorsPreflightHeaders(event, options);
    return noContent(event, _options.preflight.statusCode);
  }
  appendCorsHeaders(event, options);
  return false;
}
