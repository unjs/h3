import type { H3Event } from "../../types";
import type { H3CorsOptions } from "./types";
import { sendNoContent } from "../response";
import {
  resolveCorsOptions,
  appendCorsPreflightHeaders,
  appendCorsHeaders,
  isPreflightRequest,
} from "./utils";

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
