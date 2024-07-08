---
icon: icons8:up-round
---

# Migration guide for v1 to v2

h3 v2 includes some behavior and API changes that you need to consider applying when migrating.

> [!NOTE]
> Currently v2 is in beta stage You can try with [`h3-nightly@2x`](https://www.npmjs.com/package/h3-nightly?activeTab=versions)

> [!NOTE]
> This is an undergoing migration guide and is not finished yet.

## Fully decoupled from Node.js

We started migrating h3 towards Web standards since [v1.8](https://unjs.io/blog/2023-08-15-h3-towards-the-edge-of-the-web). h3 apps are now fully decoupled from Node.js using an adapter-based abstraction layer to support Web and Node.js runtime features and performances natively. 

This migration significantly reduces your bundle sizes and overhead in Web-native runtimes such as [Bun](https://bun.sh/), [Deno](https://deno.com) and [Cloudflare Workers](https://workers.cloudflare.com/).

Since v2, Event properties `event.node.{req,res}` and `event.web` is not available anymore, instead, you can use `getNodeContext(event)` and `getWebContext(event)` to access raw objects for each runtime.

## Response handling

You should always explicitly `return` or `throw` responses and errors from event handlers.

Previously h3 had `send*` utils that could interop the response handling lifecycle **anywhere** in any utility or middleware causing unpredictable application state control. To mitigate edge cases of this, previously h3 added `event.handler` property which is now gone!

If you were previously using these methods, you can replace them with `return` statements returning a text, JSON value, stream, or web `Response` (h3 smartly detects and handles them):

- `send(event, value)`: Use `return <value>`
- `sendNoContent(event)`: Use `return null`
- `sendError(event, error)`: Use `throw createError()`
- `sendStream(event, stream)`: Use `return stream`
- `sendWebResponse(event, response)`: Use `return response`

Other send utils that are renamed and need explicit `return`:

- `sendIterable(event, value)`: Use `return iterable()`
- `sendRedirect(event, location, code)`: Use `return redirect(event, location, code)`
- `sendProxy(event, target)`: Use `return proxy(event, target)`
- `handleCors(event)`: Check return value (boolean) and early `return` if handled.
- `serveStatic(event, content)`: Make sure to add `return` before.

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

## Router

h3 migrated to a brand new route-matching engine [unjs/rou3](https://rou3.unjs.io/).

You might experience slight (and more intuitive) behavior changes for matching patterns.

- `router.use(path, handler)` is deprecated. Use `router.all(path, handler)` instead.
- `router.add(path, method: Method | Method[]` signature is changed to `router.add(method: Method, path)` (**important**)
- `app.resolve` and `handler.__resolve` signature changed from `(path)` to `(method, path)`.

## Cookie and Headers

h3 migrated to leverage standard web [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) for all utils.

Header values are always a plain `string` now (no `null` or `undefined` or `number` or `string[]`).

For the [`Set-Cookie`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie) header, you can use [`headers.getSetCookie`](https://developer.mozilla.org/en-US/docs/Web/API/Headers/getSetCookie) that always returns a string array.

### Other deprecations

h3 v2 deprecated some legacy and aliased utilities.

**Handler:**

- `eventHandler`: Use `defineEventHandler`
- `toEventHandler`: (it is not required anymore)
- `lazyEventHandler`: Use `defineLazyEventHandler`

**Request:**

- `getHeader`: Use `getRequestHeader`
- `getHeaders`: Use `getRequestHeaders`
- `getRequestPath`: Use `event.path`

**Response:**

- `appendHeader`: Use `appendResponseHeader`
- `appendHeaders`: Use `appendResponseHeaders`
- `setHeader`: Use `setResponseHeader`
- `setHeaders` => Use `setResponseHeaders`

**Node.js:**

- `defineNodeListener`: Use `defineNodeHandler`
- `fromNodeMiddleware`: Use `fromNodeHandler`
- `createEvent`: Use `fromNodeRequest`
- `toNodeListener`: Use `toNodeHandler`
- `callNodeListener`: Use `callNodeHandler`
- `promisifyNodeListener` (removed)
- `callNodeHandler`: (internal)

**Web:**

- `callWithWebRequest`: (removed)

**Body:**

- `readBody`: Use `readJSONBody`
- `readFormData`: Use `readFormDataBody`
- `readValidatedBody`: Use `readValidatedJSONBody`
- `getRequestWebStream`: Use `getBodyStream`
- `readMultipartFormData`: Migrate to `readFormDataBody`

**Types:**

- `_RequestMiddleware`: Use `RequestMiddleware`
- `_ResponseMiddleware`: Use `ResponseMiddleware`
- `NodeListener`: Use `NodeHandler`
- `TypedHeaders`: Use `RequestHeaders` and `ResponseHeaders`
- `HTTPHeaderName`: Use `RequestHeaderName` and `ResponseHeaderName`
- `H3Headers`: Use native `Headers`
- `H3Response`: Use native `Response`
- `WebEventContext`
- `NodeEventContext`
- `NodePromisifiedHandler`
- `MultiPartData`: Use `FormData`
- `RouteNode`: Use `RouterEntry`
  `CreateRouterOptions`: use `RouterOptions`

- **Utils:**

- `isStream`: Use `instanceof ReadableStream` and `.pipe` properties for detecting Node.js `ReadableStream`
- `isWebResponse`: Use `use instanceof Response`
- `MIMES`: Removed internal map.
