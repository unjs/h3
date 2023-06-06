import { withoutTrailingSlash } from "ufo";
import {
  lazyEventHandler,
  toEventHandler,
  isEventHandler,
  eventHandler,
  H3Event,
} from "./event";
import { createError } from "./error";
import {
  send,
  sendStream,
  isStream,
  MIMES,
  sendResponseWithInternal,
  setResponseStatus,
} from "./utils";
import type { EventHandler, LazyEventHandler } from "./types";
import {
  getOriginalUrlPath,
  getUrlPath,
  setOriginalUrlPath,
  setUrlPath,
} from "./utils/url";

export interface Layer {
  route: string;
  match?: Matcher;
  handler: EventHandler;
}

export type Stack = Layer[];

export interface InputLayer {
  route?: string;
  match?: Matcher;
  handler: EventHandler;
  lazy?: boolean;
}

export type InputStack = InputLayer[];

export type Matcher = (url: string, event?: H3Event) => boolean;

export interface AppUse {
  (
    route: string | string[],
    handler: EventHandler | EventHandler[],
    options?: Partial<InputLayer>
  ): App;
  (handler: EventHandler | EventHandler[], options?: Partial<InputLayer>): App;
  (options: InputLayer): App;
}

export interface AppOptions {
  debug?: boolean;
  onError?: (error: Error, event: H3Event) => any;
}

export interface App {
  stack: Stack;
  handler: EventHandler;
  options: AppOptions;
  use: AppUse;
}

export function createApp(options: AppOptions = {}): App {
  const stack: Stack = [];
  const handler = createAppEventHandler(stack, options);
  const app: App = {
    // @ts-ignore
    use: (arg1, arg2, arg3) => use(app as App, arg1, arg2, arg3),
    handler,
    stack,
    options,
  };
  return app;
}

export function use(
  app: App,
  arg1: string | EventHandler | InputLayer | InputLayer[],
  arg2?: Partial<InputLayer> | EventHandler | EventHandler[],
  arg3?: Partial<InputLayer>
) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 as EventHandler })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(
      normalizeLayer({ ...arg2, route: "/", handler: arg1 as EventHandler })
    );
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}

export function createAppEventHandler(stack: Stack, options: AppOptions) {
  const spacing = options.debug ? 2 : undefined;
  return eventHandler(async (event) => {
    setOriginalUrlPath(
      event,
      getOriginalUrlPath(event) || getUrlPath(event) || "/"
    );
    const reqUrl = getUrlPath(event) || "/";
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!reqUrl.startsWith(layer.route)) {
          continue;
        }
        setUrlPath(event, reqUrl.slice(layer.route.length) || "/");
      } else {
        setUrlPath(event, reqUrl);
      }
      if (layer.match && !layer.match(getUrlPath(event), event)) {
        continue;
      }
      const val = await layer.handler(event);
      if (event.node?.res?.writableEnded) {
        return;
      }
      const type = typeof val;
      if (val instanceof Response) {
        return sendResponseWithInternal(event, val);
      }
      if (type === "string") {
        return send(event, val, MIMES.html);
      } else if (isStream(val)) {
        return sendStream(event, val);
      } else if (val === null) {
        setResponseStatus(event, 204);
        return send(event);
      } else if (
        type === "object" ||
        type === "boolean" ||
        type === "number" /* IS_JSON */
      ) {
        if (val.buffer) {
          return send(event, val);
        } else if (val instanceof Error) {
          throw createError(val);
        } else {
          return send(
            event,
            JSON.stringify(val, undefined, spacing),
            MIMES.json
          );
        }
      }
    }
    if (!event.node?.res?.writableEnded) {
      throw createError({
        statusCode: 404,
        statusMessage: `Cannot find any route matching ${
          getUrlPath(event) || "/"
        }.`,
      });
    }
  });
}

function normalizeLayer(input: InputLayer) {
  let handler = input.handler;
  // @ts-ignore
  if (handler.handler) {
    // @ts-ignore
    handler = handler.handler;
  }

  if (input.lazy) {
    handler = lazyEventHandler(handler as LazyEventHandler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, undefined, input.route);
  }

  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler,
  } as Layer;
}
