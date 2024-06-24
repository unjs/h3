import type { EventHandler } from "./handler";
import type { HTTPMethod } from "./http";

export type RouterMethod = Lowercase<HTTPMethod>;

export type RouterUse = (
  path: string,
  handler: EventHandler,
  method?: RouterMethod | RouterMethod[],
) => Router;
export type AddRouteShortcuts = Record<RouterMethod, RouterUse>;

export interface Router extends AddRouteShortcuts {
  add: RouterUse;
  use: RouterUse;
  handler: EventHandler;
}

export interface RouteNode {
  handlers: Partial<Record<RouterMethod | "all", EventHandler>>;
  path: string;
}

export interface CreateRouterOptions {
  /** @deprecated Please use `preemptive` instead. */
  preemtive?: boolean;
  preemptive?: boolean;
}
