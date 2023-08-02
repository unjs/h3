import type { App } from "../app";
import { toPlainHandler } from "./plain";

export type WebHandler = (
  request: Request,
  context?: Record<string, unknown>
) => Promise<Response>;

export function toWebHandler(app: App) {
  const plainHandler = toPlainHandler(app);

  const webHandler: WebHandler = async (request, context) => {
    const url = new URL(request.url);
    const res = await plainHandler({
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
  };

  return webHandler;
}
