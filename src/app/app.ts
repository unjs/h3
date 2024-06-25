import type { App, Stack, AppOptions } from "../types";
import { _kRaw } from "../event";
import { createAppEventHandler } from "./_handler";
import {
  cachedFn,
  createResolver,
  resolveWebsocketOptions,
  use,
} from "./_utils";

/**
 * Create a new H3 app instance.
 */
export function createApp(options: AppOptions = {}): App {
  const stack: Stack = [];

  const handler = createAppEventHandler(stack, options);

  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;

  const getWebsocket = cachedFn(() =>
    resolveWebsocketOptions(resolve, options),
  );

  const _use = (arg1: any, arg2: any, arg3: any) => use(app, arg1, arg2, arg3);

  const app: App = {
    use: _use as App["use"],
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    },
  };

  return app;
}
