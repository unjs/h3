import type { App, EventHandler, H3Event, H3EventContext } from "../../types";
import type {
  WebHandler,
  PlainHandler,
  PlainRequest,
  PlainResponse,
} from "../../types/web";
import { defineEventHandler } from "../../handler";
import { EventWrapper, _kRaw } from "../../event";
import { WebEvent } from "./event";
import { _normalizeResponse, _pathToRequestURL, appFetch } from "./_internal";

/**
 * Convert H3 app instance to a WebHandler with (Request, H3EventContext) => Promise<Response> signature.
 */
export function toWebHandler(app: App): WebHandler {
  const webHandler: WebHandler = async (request, context) => {
    const res = await appFetch(app, request, context);
    return new Response(res.body, res);
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
        body: event[_kRaw].getBodyStream(),
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
    return callWithPlainRequest(app, request, context);
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
        get method() {
          return event.method;
        },
        get path() {
          return event.path;
        },
        get headers() {
          return event[_kRaw].getHeaders();
        },
        get body() {
          return event[_kRaw].getBodyStream();
        },
      },
      event.context,
    );
    event[_kRaw].responseCode = res.status;
    event[_kRaw].responseMessage = res.statusText;

    const hasSetCookie = res.setCookie?.length > 0;
    for (const [key, value] of Object.entries(res.headers)) {
      if (key === "set-cookie" && hasSetCookie) {
        continue;
      }
      event[_kRaw].setResponseHeader(key, value);
    }
    if (res.setCookie?.length > 0) {
      for (const cookie of res.setCookie) {
        event[_kRaw].appendResponseHeader("set-cookie", cookie);
      }
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

export async function callWithPlainRequest(
  app: App,
  request: PlainRequest,
  context?: H3EventContext,
): Promise<PlainResponse> {
  const res = await appFetch(
    app,
    new Request(_pathToRequestURL(request.path, request.headers), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    }),
    context,
  );

  const setCookie = res.headers.getSetCookie();
  const headersObject = Object.fromEntries(res.headers.entries());
  if (setCookie.length > 0) {
    headersObject["set-cookie"] = setCookie.join(", ");
  }

  return {
    status: res.status,
    statusText: res.statusText,
    headers: headersObject,
    setCookie: setCookie,
    body: res.body,
  };
}
