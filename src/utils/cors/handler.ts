import { H3Event } from "../../event";
import { sendNoContent } from "../response";
import {
  resolveCorsOptions,
  appendCorsPreflightHeaders,
  appendCorsHeaders,
  isPreflightRequest,
} from "./utils";
import type { H3CorsOptions } from "./types";

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
