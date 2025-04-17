// Types
export * from "./types";

// H3
export { H3, serve } from "./h3";

// Event
export { isEvent, mockEvent } from "./utils/event";

// Handler
export {
  defineEventHandler,
  defineLazyEventHandler,
  dynamicEventHandler,
  defineRequestMiddleware,
  defineResponseMiddleware,
} from "./handler";

// Error
export { createError, isError } from "./error";

// ---- Adapters  ----

// Node
export {
  fromWebHandler,
  toWebHandler,
  fromNodeHandler,
  toNodeHandler,
  defineNodeHandler,
  defineNodeMiddleware,
} from "./adapters";

// ------ Utils ------

// Request
export {
  getRequestHost,
  getRequestIP,
  getRequestProtocol,
  getRequestURL,
  isMethod,
  getQuery,
  getValidatedQuery,
  assertMethod,
  getRouterParam,
  getRouterParams,
  getValidatedRouterParams,
} from "./utils/request";

// Response
export {
  writeEarlyHints,
  redirect,
  iterable,
  noContent,
} from "./utils/response";

// Proxy
export {
  proxy,
  getProxyRequestHeaders,
  proxyRequest,
  fetchWithEvent,
} from "./utils/proxy";

// Body
export { readBody, readValidatedBody } from "./utils/body";

// Cookie
export {
  getCookie,
  deleteCookie,
  parseCookies,
  setCookie,
} from "./utils/cookie";

// SSE
export { createEventStream } from "./utils/event-stream";

// Sanitize
export { sanitizeStatusCode, sanitizeStatusMessage } from "./utils/sanitize";

// Cache
export { handleCacheHeaders } from "./utils/cache";

// Static
export { serveStatic } from "./utils/static";

// Base
export { withBase } from "./utils/base";

// Session
export {
  clearSession,
  getSession,
  sealSession,
  unsealSession,
  updateSession,
  useSession,
} from "./utils/session";

// Cors
export {
  appendCorsHeaders,
  appendCorsPreflightHeaders,
  handleCors,
  isCorsOriginAllowed,
  isPreflightRequest,
} from "./utils/cors";

// Auth
export { withBasicAuth } from "./utils/auth";

// Fingerprint
export { getRequestFingerprint } from "./utils/fingerprint";

// WebSocket
export { defineWebSocketHandler, defineWebSocket } from "./utils/ws";

// ---- Deprecated ----

export * from "./_deprecated";
