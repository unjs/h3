import { describe, expect, it } from "vitest";

describe("h3 package", () => {
  it("package exports (snapshot)", async () => {
    const exportNames = Object.keys(await import("../../src")).sort();
    expect(exportNames).toMatchInlineSnapshot(`
      [
        "H3",
        "appendCorsHeaders",
        "appendCorsPreflightHeaders",
        "appendHeader",
        "appendHeaders",
        "appendResponseHeader",
        "appendResponseHeaders",
        "assertMethod",
        "clearResponseHeaders",
        "clearSession",
        "createApp",
        "createError",
        "createEventStream",
        "createRouter",
        "defaultContentType",
        "defineEventHandler",
        "defineLazyEventHandler",
        "defineNodeHandler",
        "defineNodeListener",
        "defineNodeMiddleware",
        "defineRequestMiddleware",
        "defineResponseMiddleware",
        "defineWebSocket",
        "defineWebSocketHandler",
        "deleteCookie",
        "dynamicEventHandler",
        "eventHandler",
        "fetchWithEvent",
        "fromNodeHandler",
        "fromNodeMiddleware",
        "fromWebHandler",
        "getBodyStream",
        "getCookie",
        "getHeader",
        "getHeaders",
        "getMethod",
        "getProxyRequestHeaders",
        "getQuery",
        "getRequestFingerprint",
        "getRequestHeader",
        "getRequestHeaders",
        "getRequestHost",
        "getRequestIP",
        "getRequestPath",
        "getRequestProtocol",
        "getRequestURL",
        "getRequestWebStream",
        "getResponseHeader",
        "getResponseHeaders",
        "getResponseStatus",
        "getResponseStatusText",
        "getRouterParam",
        "getRouterParams",
        "getSession",
        "getValidatedQuery",
        "getValidatedRouterParams",
        "handleCacheHeaders",
        "handleCors",
        "isCorsOriginAllowed",
        "isError",
        "isEvent",
        "isMethod",
        "isPreflightRequest",
        "iterable",
        "lazyEventHandler",
        "mockEvent",
        "noContent",
        "parseCookies",
        "proxy",
        "proxyRequest",
        "readBody",
        "readFormData",
        "readFormDataBody",
        "readRawBody",
        "readValidatedBody",
        "redirect",
        "removeResponseHeader",
        "sanitizeStatusCode",
        "sanitizeStatusMessage",
        "sealSession",
        "sendIterable",
        "sendNoContent",
        "sendProxy",
        "sendRedirect",
        "sendStream",
        "sendWebResponse",
        "serve",
        "serveStatic",
        "setCookie",
        "setHeader",
        "setHeaders",
        "setResponseHeader",
        "setResponseHeaders",
        "setResponseStatus",
        "toEventHandler",
        "toNodeHandler",
        "toNodeListener",
        "toWebHandler",
        "unsealSession",
        "updateSession",
        "useBase",
        "useSession",
        "withBase",
        "withBasicAuth",
        "writeEarlyHints",
      ]
    `);
  });
});
