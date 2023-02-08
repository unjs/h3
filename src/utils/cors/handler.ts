import { defineEventHandler } from "../../event";
import { sendNoContent } from "../response";
import {
  resolveCorsOptions,
  appendCorsPreflightHeaders,
  appendCorsActualRequestHeaders,
  isPreflightRequest,
} from "./utils";
import type { CorsOptions } from "./types";

export function handleCors(options: CorsOptions) {
  const {
    preflight: { statusCode },
  } = resolveCorsOptions(options);

  return defineEventHandler((event) => {
    if (isPreflightRequest(event)) {
      appendCorsPreflightHeaders(event, options);
      sendNoContent(event, statusCode);
    } else {
      appendCorsActualRequestHeaders(event, options);
    }
  });
}
