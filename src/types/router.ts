import type { EventHandler } from "./handler";
import type { HTTPMethod } from "./http";

type AddRoute = (path: string, handler: EventHandler) => Router;

export interface Router {
  all: AddRoute;
  /** @deprecated please use router.all */
  use: Router["all"];
  get: AddRoute;
  post: AddRoute;
  put: AddRoute;
  delete: AddRoute;
  patch: AddRoute;
  head: AddRoute;
  options: AddRoute;
  connect: AddRoute;
  trace: AddRoute;
  add: (
    method: "" | HTTPMethod | Lowercase<HTTPMethod>,
    path: string,
    handler: EventHandler,
  ) => Router;

  handler: EventHandler;
}

export interface RouterEntry {
  method: HTTPMethod;
  route: string;
  handler: EventHandler;
}

export interface RouterOptions {
  preemptive?: boolean;
}
