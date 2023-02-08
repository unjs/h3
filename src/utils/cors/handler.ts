import { defineEventHandler } from "../../event";
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

      event.node.res.statusCode = statusCode;
      event.node.res.setHeader("Content-Length", "0");
      event.node.res.end();
    } else {
      appendCorsActualRequestHeaders(event, options);
    }
  });
}
