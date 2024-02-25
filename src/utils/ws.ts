import type { UserHooks } from "crossws";

import { createError } from "../error";
import { defineEventHandler } from "../event";

/**
 * Define WebSocket hooks.
 *
 * @see https://h3.unjs.io/guide/websocket
 */
export function defineWebSocket<T extends UserHooks>(hooks: T): T {
  return hooks;
}

/**
 * Define WebSocket event handler.
 *
 * @see https://h3.unjs.io/guide/websocket
 */
export function defineWebSocketHandler<T extends UserHooks>(hooks: T) {
  return defineEventHandler({
    handler() {
      throw createError({
        statusCode: 426,
        statusMessage: "Upgrade Required",
      });
    },
    websocket: hooks,
  });
}
