import type { H3, EventHandler, H3Event, H3EventContext } from "../../types";
import { _kRaw } from "../../event";
import { WebEvent } from "./event";
import { _normalizeResponse, _pathToRequestURL } from "./_internal";

type WebHandler = (
  request: Request,
  context?: H3EventContext,
) => Promise<Response>;

export function toWebHandler(app: H3): WebHandler {
  return (request, context) => {
    return app.fetch(request, { h3: context });
  };
}

export function fromWebHandler(handler: WebHandler): EventHandler {
  return (event) => handler(toWebRequest(event), event.context);
}

/**
 * Convert an H3Event object to a web Request object.
 *
 */
export function toWebRequest(event: H3Event): Request {
  return (
    (event[_kRaw] as WebEvent)._req ||
    new Request(
      _pathToRequestURL(event[_kRaw].path, event[_kRaw].getHeaders()),
      {
        // @ts-ignore Undici option
        duplex: "half",
        method: event[_kRaw].method,
        headers: event[_kRaw].getHeaders(),
        body: event[_kRaw].getBodyStream(),
      },
    )
  );
}

export function getWebContext(
  event: H3Event,
): undefined | ReturnType<WebEvent["getContext"]> {
  const raw = event[_kRaw] as WebEvent;
  if (!(raw?.constructor as any)?.isWeb) {
    return undefined;
  }
  return raw.getContext();
}
