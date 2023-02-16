import { H3Event } from "../../event";
import { sendNoContent } from "../response";
import {
  resolveCorsOptions,
  appendCorsPreflightHeaders,
  appendCorsActualRequestHeaders,
  isPreflightRequest,
} from "./utils";
import type { H3CorsOptions } from "./types";

export function handleCors(event: H3Event, options: H3CorsOptions) {
  const _options = resolveCorsOptions(options);
  if (isPreflightRequest(event)) {
    appendCorsPreflightHeaders(event, options);
    sendNoContent(event, _options.preflight.statusCode);
  } else {
    appendCorsActualRequestHeaders(event, options);
  }
}
