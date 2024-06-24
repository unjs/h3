// App
export { createApp, use, createAppEventHandler } from "./app";

// Event
export { isEvent } from "./event";

// Handler
export {
  isEventHandler,
  defineEventHandler,
  defineLazyEventHandler,
  dynamicEventHandler,
  toEventHandler,
  defineRequestMiddleware,
  defineResponseMiddleware,
} from "./handler";

// Error
export { createError, isError, sendError } from "./error";

// Router
export { createRouter } from "./router";

// ---- Adapters  ----

// Node
export {
  defineNodeMiddleware,
  callNodeHandler,
  defineNodeHandler,
  fromNodeHandler,
  fromNodeRequest,
  getNodeContext,
  toNodeHandler,
} from "./adapters/node";

// Web
export {
  fromPlainHandler,
  fromWebHandler,
  toPlainHandler,
  toWebHandler,
  toWebRequest,
  fromPlainRequest,
  getWebContext,
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
  sendIterable,
  sendNoContent,
  sendRedirect,
  sendWebResponse,
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
} from "./utils/response";

// Proxy
export {
  sendProxy,
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
export { useBase } from "./utils/base";

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

export * from "./deprecated";
