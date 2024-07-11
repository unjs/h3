import type { H3Route } from "./h3";
import type { Session } from "./utils/session";

export interface H3EventContext extends Record<string, any> {
  /* Matched router parameters */
  params?: Record<string, string>;

  /**
   * Matched router Node
   *
   * @experimental The object structure may change in non-major version.
   */
  matchedRoute?: H3Route;

  /* Cached session data */
  sessions?: Record<string, Session>;

  /* Trusted IP Address of client */
  clientAddress?: string;
}
