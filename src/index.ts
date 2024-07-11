// Types
export * from "./types";

// H3
export { createH3 } from "./h3";

// Event
export { isEvent } from "./event";

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
  getNodeContext,
  fromNodeHandler,
  toNodeHandler,
  defineNodeHandler,
  defineNodeMiddleware,
} from "./adapters/node";

// Web
export {
  getWebContext,
  fromWebHandler,
  toWebHandler,
  fromWebRequest,
  toWebRequest,
  fromPlainHandler,
  toPlainHandler,
  fromPlainRequest,
  callWithPlainRequest,
} from "./adapters/web";

// ------ Utils ------

// Request
export {
  getRequestHeader,
  getRequestHeaders,
  getRequestHost,
  getRequestIP,
  getRequestProtocol,
  getRequestURL,
  isMethod,
  getQuery,
  getMethod,
  getValidatedQuery,
  assertMethod,
  getRouterParam,
  getRouterParams,
  getValidatedRouterParams,
} from "./utils/request";

// Response
export {
  appendResponseHeader,
  appendResponseHeaders,
  setResponseHeader,
  setResponseHeaders,
  setResponseStatus,
  writeEarlyHints,
  removeResponseHeader,
  clearResponseHeaders,
  defaultContentType,
  getResponseHeader,
  getResponseHeaders,
  getResponseStatus,
  getResponseStatusText,
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
export {
  readRawBody,
  getBodyStream,
  readFormDataBody,
  readJSONBody,
  readTextBody,
  readValidatedJSONBody,
} from "./utils/body";

// Cookie
export {
  getCookie,
  deleteCookie,
  parseCookies,
  setCookie,
  splitCookiesString,
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

// Fingerprint
export { getRequestFingerprint } from "./utils/fingerprint";

// WebSocket
export { defineWebSocketHandler, defineWebSocket } from "./utils/ws";

// ---- Deprecated ----

export * from "./_deprecated";
