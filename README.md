# H3

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![Codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]
[![JSDocs][jsdocs-src]][jsdocs-href]

H3 is a minimal h(ttp) framework built for high performance and portability.

👉 [Online Playground](https://stackblitz.com/github/unjs/h3/tree/main/playground?startScript=dev)

## Features

✔️ &nbsp;**Portable:** Works perfectly in Serverless, Workers, and Node.js

✔️ &nbsp;**Minimal:** Small and tree-shakable

✔️ &nbsp;**Modern:** Native promise support

✔️ &nbsp;**Extendable:** Ships with a set of composable utilities but can be extended

✔️ &nbsp;**Router:** Super fast route matching using [unjs/radix3](https://github.com/unjs/radix3)

✔️ &nbsp;**Compatible:** Compatibility layer with node/connect/express middleware

## Install

```bash
# Using npm
npm install h3

# Using yarn
yarn add h3

# Using pnpm
pnpm add h3
```

<details>
  <summary>Using Nightly Releases</summary>

If you are directly using `h3` as a dependency:

```json
{
  "dependencies": {
    "h3": "npm:h3-nightly@latest"
  }
}
```

If you are using a framework ([Nuxt](https://nuxt.com/) or [Nitro](https://nitro.unjs.io/)) that is using `h3`:

pnpm and yarn:

```json
{
  "resolutions": {
    "h3": "npm:h3-nightly@latest"
  }
}
```

npm:

```json
{
  "overrides": {
    "h3": "npm:h3-nightly@latest"
  }
}
```

**Note:** Make sure to recreate lockfile and `node_modules` after reinstall to avoid hoisting issues.

</details>

## Usage

```ts
import { createServer } from "node:http";
import { createApp, eventHandler, toNodeListener } from "h3";

const app = createApp();
app.use(
  "/",
  eventHandler(() => "Hello world!"),
);

createServer(toNodeListener(app)).listen(process.env.PORT || 3000);
```

Example using <a href="https://github.com/unjs/listhen">listhen</a> for an elegant listener:

```ts
import { createApp, eventHandler, toNodeListener } from "h3";
import { listen } from "listhen";

const app = createApp();
app.use(
  "/",
  eventHandler(() => "Hello world!"),
);

listen(toNodeListener(app));
```

## Router

The `app` instance created by `h3` uses a middleware stack (see [how it works](./src/app.ts)) with the ability to match route prefix and apply matched middleware.

To opt-in using a more advanced and convenient routing system, we can create a router instance and register it to app instance.

```ts
import { createApp, eventHandler, createRouter } from "h3";

const app = createApp();

const router = createRouter()
  .get(
    "/",
    eventHandler(() => "Hello World!"),
  )
  .get(
    "/hello/:name",
    eventHandler((event) => `Hello ${event.context.params.name}!`),
  );

app.use(router);
```

**Tip:** We can register the same route more than once with different methods.

Routes are internally stored in a [Radix Tree](https://en.wikipedia.org/wiki/Radix_tree) and matched using [unjs/radix3](https://github.com/unjs/radix3).

For using nested routers, see [this example](https://stackblitz.com/edit/github-2bmusk?file=app.ts&startScript=dev)

## More app usage examples

```js
// Handle can directly return object or Promise<object> for JSON response
app.use(
  "/api",
  eventHandler((event) => ({ url: event.node.req.url })),
);

// We can have better matching other than quick prefix match
app.use(
  "/odd",
  eventHandler(() => "Is odd!"),
  { match: (url) => url.substr(1) % 2 },
);

// Handle can directly return string for HTML response
app.use(eventHandler(() => "<h1>Hello world!</h1>"));

// We can chain calls to .use()
app
  .use(
    "/1",
    eventHandler(() => "<h1>Hello world!</h1>"),
  )
  .use(
    "/2",
    eventHandler(() => "<h1>Goodbye!</h1>"),
  );

// We can proxy requests and rewrite cookie's domain and path
app.use(
  "/api",
  eventHandler((event) =>
    proxyRequest(event, "https://example.com", {
      // f.e. keep one domain unchanged, rewrite one domain and remove other domains
      cookieDomainRewrite: {
        "example.com": "example.com",
        "example.com": "somecompany.co.uk",
        "*": "",
      },
      cookiePathRewrite: {
        "/": "/api",
      },
    }),
  ),
);

// Legacy middleware with 3rd argument are automatically promisified
app.use(
  fromNodeMiddleware((req, res, next) => {
    req.setHeader("x-foo", "bar");
    next();
  }),
);

// Lazy loaded routes using { lazy: true }
app.use("/big", () => import("./big-handler"), { lazy: true });
```

## Utilities

H3 has a concept of composable utilities that accept `event` (from `eventHandler((event) => {})`) as their first argument. This has several performance benefits over injecting them to `event` or `app` instances in global middleware commonly used in Node.js frameworks, such as Express. This concept means only required code is evaluated and bundled, and the rest of the utilities can be tree-shaken when not used.

👉 You can check list of exported built-in utils from [JSDocs Documentation](https://www.jsdocs.io/package/h3#package-functions).

#### Body

- `readRawBody(event, encoding?)`
- `readBody(event)`
- `readValidatedBody(event, validate)`
- `readMultipartFormData(event)`

#### Request

- `getQuery(event)`
- `getValidatedQuery(event, validate)`
- `getRouterParams(event)`
- `getMethod(event, default?)`
- `isMethod(event, expected, allowHead?)`
- `assertMethod(event, expected, allowHead?)`
- `getRequestHeaders(event, headers)` (alias: `getHeaders`)
- `getRequestHeader(event, name)` (alias: `getHeader`)
- `getRequestURL(event)`
- `getRequestHost(event)`
- `getRequestProtocol(event)`
- `getRequestPath(event)`
- `getRequestIP(event, { xForwardedFor: boolean })`

#### Response

- `send(event, data, type?)`
- `sendNoContent(event, code = 204)`
- `setResponseStatus(event, status)`
- `getResponseStatus(event)`
- `getResponseStatusText(event)`
- `getResponseHeaders(event)`
- `getResponseHeader(event, name)`
- `setResponseHeaders(event, headers)` (alias: `setHeaders`)
- `setResponseHeader(event, name, value)` (alias: `setHeader`)
- `appendResponseHeaders(event, headers)` (alias: `appendHeaders`)
- `appendResponseHeader(event, name, value)` (alias: `appendHeader`)
- `defaultContentType(event, type)`
- `sendRedirect(event, location, code=302)`
- `isStream(data)`
- `sendStream(event, data)`
- `writeEarlyHints(event, links, callback)`

#### Sanitize

- `sanitizeStatusMessage(statusMessage)`
- `sanitizeStatusCode(statusCode, default = 200)`

#### Error

- `sendError(event, error, debug?)`
- `createError({ statusCode, statusMessage, data? })`

#### Route

- `useBase(base, handler)`

#### Proxy

- `sendProxy(event, { target, ...options })`
- `proxyRequest(event, { target, ...options })`
- `fetchWithEvent(event, req, init, { fetch? }?)`
- `getProxyRequestHeaders(event)`

#### Cookie

- `parseCookies(event)`
- `getCookie(event, name)`
- `setCookie(event, name, value, opts?)`
- `deleteCookie(event, name, opts?)`
- `splitCookiesString(cookiesString)`

#### Session

- `useSession(event, config = { password, maxAge?, name?, cookie?, seal?, crypto? })`
- `getSession(event, config)`
- `updateSession(event, config, update)`
- `sealSession(event, config)`
- `unsealSession(event, config, sealed)`
- `clearSession(event, config)`

#### Cache

- `handleCacheHeaders(event, opts)`

#### Cors

- `handleCors(options)` (see [h3-cors](https://github.com/NozomuIkuta/h3-cors) for more detail about options)
- `isPreflightRequest(event)`
- `isCorsOriginAllowed(event)`
- `appendCorsHeaders(event, options)` (see [h3-cors](https://github.com/NozomuIkuta/h3-cors) for more detail about options)
- `appendCorsPreflightHeaders(event, options)` (see [h3-cors](https://github.com/NozomuIkuta/h3-cors) for more detail about options)

## Community Packages

You can use more H3 event utilities made by the community.

Please check their READMEs for more details.

PRs are welcome to add your packages.

- [h3-typebox](https://github.com/kevinmarrec/h3-typebox)
  - `validateBody(event, schema)`
  - `validateQuery(event, schema)`
- [h3-zod](https://github.com/wobsoriano/h3-zod)
  - `useValidatedBody(event, schema)`
  - `useValidatedQuery(event, schema)`
- [h3-valibot](https://github.com/intevel/h3-valibot)
  - `useValidateBody(event, schema)`
  - `useValidateParams(event, schema)`

## License

MIT

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/h3?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/h3
[npm-downloads-src]: https://img.shields.io/npm/dm/h3?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/h3
[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/h3/main?style=flat&colorA=18181B&colorB=F0DB4F
[codecov-href]: https://codecov.io/gh/unjs/h3
[bundle-src]: https://img.shields.io/bundlephobia/minzip/h3?style=flat&colorA=18181B&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=h3
[license-src]: https://img.shields.io/github/license/unjs/h3.svg?style=flat&colorA=18181B&colorB=F0DB4F
[license-href]: https://github.com/unjs/h3/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsDocs.io-reference-18181B?style=flat&colorA=18181B&colorB=F0DB4F
[jsdocs-href]: https://www.jsdocs.io/package/h3
