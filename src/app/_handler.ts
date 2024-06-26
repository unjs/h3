import type {
  AppOptions,
  EventHandler,
  EventHandlerRequest,
  ResponseBody,
  Stack,
} from "../types";
import { defineEventHandler } from "../handler";
import { _kRaw } from "../event";
import { createError } from "../error";
import { handleAppResponse } from "./_response";

export function createAppEventHandler(
  stack: Stack,
  options: AppOptions,
): EventHandler<EventHandlerRequest, Promise<ResponseBody>> {
  return defineEventHandler(async (event) => {
    try {
      // Keep a copy of incoming url
      const _reqPath = event[_kRaw].path || "/";

      // Layer path is the path without the prefix
      let _layerPath: string;

      // Call onRequest hook
      if (options.onRequest) {
        await options.onRequest(event);
      }

      // Run through stack
      for (const layer of stack) {
        // 1. Remove prefix from path
        if (layer.route.length > 1) {
          if (!_reqPath.startsWith(layer.route)) {
            continue;
          }
          _layerPath = _reqPath.slice(layer.route.length) || "/";
        } else {
          _layerPath = _reqPath;
        }

        // 2. Custom matcher
        if (layer.match && !layer.match(_layerPath, event)) {
          continue;
        }

        // 3. Update event path with layer path
        event[_kRaw].path = _layerPath;

        // 4. Handle request
        const val = await layer.handler(event);

        // 5. Handle response
        const _body = val === undefined ? undefined : await val;
        if (_body !== undefined) {
          return handleAppResponse(event, _body, options);
        }
      }

      // Throw 404 is no handler in the stack responded
      throw createError({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`,
      });
    } catch (error: unknown) {
      return handleAppResponse(event, error, options);
    }
  });
}
