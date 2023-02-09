import { H3Event } from "../../event";
import { sendNoContent } from "../response";
import {
  resolveCorsOptions,
  appendCorsPreflightHeaders,
  appendCorsActualRequestHeaders,
  isPreflightRequest,
} from "./utils";
import type { CorsOptions } from "./types";

export function handleCors(event: H3Event, options: CorsOptions) {
  const {
    preflight: { statusCode },
  } = resolveCorsOptions(options);

  if (isPreflightRequest(event)) {
    appendCorsPreflightHeaders(event, options);
    sendNoContent(event, statusCode);
  } else {
    appendCorsActualRequestHeaders(event, options);
  }
}
