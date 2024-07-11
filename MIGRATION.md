---
icon: icons8:up-round
---

# Migration guide for v1 to v2

h3 v2 includes some behavior and API changes that you need to consider applying when migrating.

> [!NOTE]
> Currently v2 is in beta stage You can try with [`h3-nightly@2x`](https://www.npmjs.com/package/h3-nightly?activeTab=versions)

> [!NOTE]
> This is an undergoing migration guide and is not finished yet.

## Web adapter

H3 v2 is now web-native and you can directly use `app.fetch(request, init)`.

Old utils for plain handler and web handler are removed to embrace web standards.

## Event interface

Event Properties `event.node.{req,res}` and `event.web` are not available anymore, instead, you can use `getNodeContext(event)` and `getWebContext(event)` utils to access raw objects for each runtime.

`event.handler` property is removed since h3 relies on explicit responses.

## Response handling

You should always explicitly use `return` for response and `throw` for errors from event handlers.

If you were previously using these methods, you can replace them with `return` statements returning a text, JSON, stream, or web `Response` (h3 smartly detects and handles them):

- `send(event, value)`: Migrate to `return <value>`.
- `sendError(event, <error>)`: Migrate to `throw createError(<error>)`.
- `sendStream(event, <stream>)`: Migrate to `return <stream>`.
- `sendWebResponse(event, <response>)`: Migrate to `return <response>`.

Other send utils that are renamed and need explicit `return`:

- `sendNoContent(event)` / `return null`: Migrate to `return noContent(event)`.
- `sendIterable(event, <value>)`: Migrate to `return iterable(<value>)`.
- `sendRedirect(event, location, code)`: Migrate to `return redirect(event, location, code)`.
- `sendProxy(event, target)`: Migrate to `return proxy(event, target)`.
- `handleCors(event)`: Check return value (boolean) and early `return` if handled.
- `serveStatic(event, content)`: Make sure to add `return` before.

## App interface and router

Router functionality is now integrated into the h3 app core. Instead of `createApp()` and `createRouter()` you can use `const app = createH3()`.

Methods:

- `app.use(handler)`: Add a global middleware.
- `app.use(route, handler)`: Add a routed middleware.
- `app.on(method, handler)` / `app.all(handler)` / `app.[METHOD](handler)`: Add a route handler.

Running order:

- All global middleware in the same order they added
- All routed middleware from least specific to most specific paths (auto-sorted)
- Matched route handler

Any middleware or route handler can return a response.

Other changes from v1:

- Handlers registered with `app.use("/path", handler)` only match `/path` (not `/path/foo/bar`). For matching all subpaths like before, it should be updated to `app.use("/path/**", handler)`.
- The `event.path` received in each handler will have a full path without omitting the prefixes. use `withBase(base, handler)` utility to make prefixed app. (example: `withBase("/api", app.handler)`).
- `app.use(() => handler, { lazy: true })` is no supported anymore. Instead you can use `app.use(defineLazyEventHandler(() => handler), { lazy: true })`
- `app.use(["/path1", "/path2"], ...)` and `app.use("/path", [handler1, handler2])` are not supported anymore. Instead, use multiple `app.use()` calls.
- Custom `match` function for `app.use` is not supported anymore (middleware can skip themselves).
- `app.resolve(path) => { route, handler }` changed to `app.resolve(method, path) => { method route, handler }`

### Router

h3 migrated to a brand new route-matching engine [unjs/rou3](https://rou3.unjs.io/).

You might experience slight (and more intuitive) behavior changes for matching patterns.

- `router.use(path, handler)` is deprecated. Use `router.all(path, handler)` instead.
- `router.add(path, method: Method | Method[]` signature is changed to `router.add(method: Method, path)` (**important**)

## Body utils

The legacy `readBody` and `readRawBody` utils are replaced with a new set of body utils that can leverage native runtime primitives better.

- `readRawBody`: Returns body as [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) which is similar to Node.js `Buffer`.
- `readTextBody`: Returns body as text (`utf8`).
- `readJSONBody` / `readValidatedJSONBody`: Returns JSON value of the body using `JSON.parse` or `URLSearchParams` for `form-urlencoded`
- `readFormDataBody`: Returns body parsed as [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData).
- `getBodyStream`: Returns body as a [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream), replacing older experimental `getRequestWebStream`: Util.

**Behavior changes:**

- Body utils won't throw an error if the incoming request has no body (or is a `GET` method for example) but instead, returns `undefined`
- `readJSONBody` does not use [unjs/destr](https://destr.unjs.io) anymore. You should always filter and sanitize data coming from user to avoid [prototype-poisoning](https://medium.com/intrinsic-blog/javascript-prototype-poisoning-vulnerabilities-in-the-wild-7bc15347c96)

## Cookie and headers

h3 migrated to leverage standard web [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) for all utils.

Header values are always a plain `string` now (no `null` or `undefined` or `number` or `string[]`).

For the [`Set-Cookie`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie) header, you can use [`headers.getSetCookie`](https://developer.mozilla.org/en-US/docs/Web/API/Headers/getSetCookie) that always returns a string array.

### Other deprecations

h3 v2 deprecated some legacy and aliased utilities.

**App and router:**

- `createRouter`: Migrate to `createH3`
- `createApp`: Migrate to `createH3`

**Handler:**

- `eventHandler`: Migrate to `defineEventHandler`
- `lazyEventHandler`: Migrate to `defineLazyEventHandler`
- `useBase`: Migrate to `withbase`
- `toEventHandler` / `isEventHandler`: (removed) Any function can be an event handler.

**Request:**

- `getHeader`: Migrate to `getRequestHeader`.
- `getHeaders`: Migrate to `getRequestHeaders`.
- `getRequestPath`: Migrate to `event.path`.

**Response:**

- `appendHeader`: Migrate to `appendResponseHeader`.
- `appendHeaders`: Migrate to `appendResponseHeaders`.
- `setHeader`: Migrate to `setResponseHeader`.
- `setHeaders`: Migrate to `setResponseHeaders`.

**Node.js:**

- `defineNodeListener`: Migrate to `defineNodeHandler`.
- `fromNodeMiddleware`: Migrate to `fromNodeHandler`.
- `toNodeListener`: Migrate to `toNodeHandler`.
- `createEvent`: (removed): Use Node.js adapter (`toNodeHandler(app)`).
- `fromNodeRequest`: (removed): Use Node.js adapter (`toNodeHandler(app)`).
- `promisifyNodeListener` (removed).
- `callNodeListener`: (removed).

**Web:**

- `fromPlainHandler`: (removed) Migrate to Web API.
- `toPlainHandler`: (removed) Migrate to Web API.
- `fromPlainRequest` (removed) Migrate to Web API or use `mockEvent` util for testing.
- `callWithPlainRequest` (removed) Migrate to Web API.
- `fromWebRequest`: (removed) Migrate to Web API.
- `callWithWebRequest`: (removed).

**Body:**

- `readBody`: Migrate to `readJSONBody`.
- `readFormData`: Migrate to `readFormDataBody`.
- `readValidatedBody`: Migrate to `readValidatedJSONBody`.
- `getRequestWebStream`: Migrate to `getBodyStream`.
- `readMultipartFormData`: Migrate to `readFormDataBody`.

- **Utils:**

- `isStream`: Migrate to `instanceof ReadableStream` and `.pipe` properties for detecting Node.js `ReadableStream`.
- `isWebResponse`: Migrate to `use instanceof Response`.
- `MIMES`: (removed).

**Types:**

- `App`: Migrate to `H3`.
- `AppOptions`: Migrate to `H3Config`.
- `_RequestMiddleware`: Migrate to `RequestMiddleware`.
- `_ResponseMiddleware`: Migrate to `ResponseMiddleware`.
- `NodeListener`: Migrate to `NodeHandler`.
- `TypedHeaders`: Migrate to `RequestHeaders` and `ResponseHeaders`.
- `HTTPHeaderName`: Migrate to `RequestHeaderName` and `ResponseHeaderName`.
- `H3Headers`: Migrate to native `Headers`.
- `H3Response`: Migrate to native `Response`.
- `MultiPartData`: Migrate to native `FormData`.
- `RouteNode`: Migrate to `RouterEntry`.
  `CreateRouterOptions`: Migrate to `RouterOptions`.

Removed type exports: `WebEventContext`, `NodeEventContext`, `NodePromisifiedHandler`, `AppUse`, `Stack`, `InputLayer`, `InputStack`, `Layer`, `Matcher`, `PlainHandler`, `PlainRequest`, `PlainReponse`, `WebHandler`
