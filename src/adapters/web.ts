import type { App } from "../app";
import { eventHandler } from "../event";
import { _handlePlainRequest } from "./plain";
import { toWebRequest } from "src/utils";

/** @experimental */
export type WebHandler = (
  request: Request,
  context?: Record<string, unknown>,
) => Promise<Response>;

/** @experimental */
export function toWebHandler(app: App) {
  const webHandler: WebHandler = (request, context) => {
    return _handleWebRequest(app, request, context);
  };

  return webHandler;
}

/** @experimental */
export function fromWebHandler(handler: WebHandler) {
  return eventHandler((event) => handler(toWebRequest(event), event.context));
}

// --- Internal ---

const nullBodyResponses = new Set([101, 204, 205, 304]);

async function _handleWebRequest(
  app: App,
  request: Request,
  context?: Record<string, unknown>,
) {
  const url = new URL(request.url);
  const res = await _handlePlainRequest(app, {
    _eventOverrides: {
      web: { request, url },
    },
    context,
    method: request.method,
    path: url.pathname + url.search,
    headers: request.headers,
    body: request.body,
  });

  // https://developer.mozilla.org/en-US/docs/Web/API/Response/body
  const body =
    nullBodyResponses.has(res.status) || request.method === "HEAD"
      ? null
      : (res.body as BodyInit);

  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}
