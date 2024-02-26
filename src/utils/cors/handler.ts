import { H3Event } from "../../event";
import { sendNoContent } from "../response";
import type { Status } from "../types";
import {
  resolveCorsOptions,
  appendCorsPreflightHeaders,
  appendCorsHeaders,
  isPreflightRequest,
} from "./utils";
import type { H3CorsOptions } from "./types";

/**
 * Handle CORS for the incoming request.
 *
 * If the incoming request is a CORS preflight request, it will append the CORS preflight headers and send a 204 response.
 *
 * If return value is `true`, the request is handled and no further action is needed.
 */
export function handleCors(event: H3Event, options: H3CorsOptions): boolean {
  const _options = resolveCorsOptions(options);
  if (isPreflightRequest(event)) {
    appendCorsPreflightHeaders(event, options);
    sendNoContent(event, _options.preflight.statusCode as unknown as Status);
    return true;
  }
  appendCorsHeaders(event, options);
  return false;
}
