import type { UserHooks } from "crossws";

/**
 * Define WebSocket hooks.
 *
 * @see https://crossws.unjs.io
 */
export function defineWebSocket<T extends UserHooks>(hooks: T): T {
  return hooks;
}
