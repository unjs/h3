import type { App } from "../app";
import { _handlePlainRequest, toPlainHandler } from "./plain";

export type WebHandler = (
  request: Request,
  context?: Record<string, unknown>
) => Promise<Response>;

export function toWebHandler(app: App) {
  const webHandler: WebHandler = (request, context) => {
    return _handleWebRequest(app, request, context);
  };

  return webHandler;
}

// --- Internal ---

async function _handleWebRequest(
  app: App,
  request: Request,
  context?: Record<string, unknown>
) {
  const url = new URL(request.url);
  const res = await _handlePlainRequest(app, {
    _eventOverrides: {
      _request: request,
      _url: url,
    },
    context,
    method: request.method,
    path: url.pathname + url.search,
    headers: request.headers,
    body: request.body,
  });

  return new Response(res.body as BodyInit, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}
