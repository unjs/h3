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
  handler: EventHandler;
  path: string;
  method: string;
}

export interface CreateRouterOptions {
  preemptive?: boolean;
}
