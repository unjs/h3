import type { App } from "../../app";
import type { EventHandler, H3Event, H3EventContext } from "../../types";
import type { WebHandler, PlainHandler, PlainRequest } from "./types";
import { defineEventHandler } from "../../handler";
import { EventWrapper, _kRaw } from "../../event";
import { WebEvent } from "./event";
import { _handleWebRequest, _pathToRequestURL } from "./_internal";

/**
 * Convert H3 app instance to a WebHandler with (Request, H3EventContext) => Promise<Response> signature.
 */
export function toWebHandler(app: App): WebHandler {
  const webHandler: WebHandler = async (request, context) => {
    const response = await _handleWebRequest(app, request, context);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };

  return webHandler;
}

export function fromWebHandler(handler: WebHandler): EventHandler {
  return defineEventHandler((event) =>
    handler(toWebRequest(event), event.context),
  );
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
        body: event[_kRaw].readBodyStream(),
      },
    )
  );
}

/**
 * Create an H3Event object from a web Request object.
 */
export function fromWebRequest(
  request: Request,
  context?: H3EventContext,
): H3Event {
  const rawEvent = new WebEvent(request);
  const event = new EventWrapper(rawEvent);
  if (context) {
    Object.assign(event.context, context);
  }
  return event;
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

// ----------------------------
// Plain
// ----------------------------

/**
 * Convert H3 app instance to a PlainHandler with (PlainRequest, H3EventContext) => Promise<PlainResponse> signature.
 */
export function toPlainHandler(app: App) {
  const handler: PlainHandler = async (request, context) => {
    const res = await _handleWebRequest(
      app,
      new Request(_pathToRequestURL(request.path, request.headers), {
        method: request.method,
        headers: request.headers,
        body: request.body,
      }),
      context,
    );
    return {
      status: res.status,
      statusText: res.statusText,
      headers: [...res.headers.entries()],
      setCookie: res.headers.getSetCookie(),
      body: res.body,
    };
  };
  return handler;
}

/**
 * Convert a PlainHandler to an EventHandler.
 */
export function fromPlainHandler(handler: PlainHandler) {
  return defineEventHandler(async (event) => {
    const res = await handler(
      {
        method: event.method,
        path: event.path,
        headers: event[_kRaw].getHeaders(),
        body: undefined, // TODO
      },
      event.context,
    );
    event[_kRaw].responseCode = res.status;
    event[_kRaw].responseMessage = res.statusText;
    for (const [key, value] of res.headers) {
      event[_kRaw].setResponseHeader(key, value);
    }
    return res.body;
  });
}

/**
 * Create an H3Event object from a plain request object.
 */
export function fromPlainRequest(
  request: PlainRequest,
  context?: H3EventContext,
): H3Event {
  return fromWebRequest(
    new Request(_pathToRequestURL(request.path, request.headers), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    }),
    context,
  );
}
