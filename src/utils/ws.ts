import type { UserHooks } from "crossws";

import { createError } from "../error";
import { defineEventHandler } from "../event";

/**
 * Define WebSocket hooks.
 *
 * @see https://crossws.unjs.io
 */
export function defineWebSocket<T extends UserHooks>(hooks: T): T {
  return hooks;
}

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
