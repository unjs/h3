[![npm downloads](https://img.shields.io/npm/dm/h3.svg?style=flat-square)](https://npmjs.com/package/h3)
[![version](https://img.shields.io/npm/v/h3/latest.svg?style=flat-square)](https://npmjs.com/package/h3)
[![bundlephobia](https://img.shields.io/bundlephobia/min/h3/latest.svg?style=flat-square)](https://bundlephobia.com/result?p=h3)
[![build status](https://img.shields.io/github/workflow/status/unjs/h3/ci/main?style=flat-square)](https://github.com/unjs/h3/actions)
[![coverage](https://img.shields.io/codecov/c/gh/unjs/h3/main?style=flat-square)](https://codecov.io/gh/unjs/h3)
[![jsDocs.io](https://img.shields.io/badge/jsDocs.io-reference-blue?style=flat-square)](https://www.jsdocs.io/package/h3)

> H3 is a minimal h(ttp) framework built for high performance and portability

<!-- ![h3 - Tiny JavaScript Server](.github/banner.svg) -->

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

## Usage

```ts
import { createServer } from 'http'
import { createApp, eventHandler, toNodeListener } from 'h3'

const app = createApp()
app.use('/', eventHandler(() => 'Hello world!'))

createServer(toNodeListener(app)).listen(process.env.PORT || 3000)
```

<details>
 <summary>Example using <a href="https://github.com/unjs/listhen">listhen</a> for an elegant listener.</summary>

```ts
import { createApp, toNodeListener } from 'h3'
import { listen } from 'listhen'

const app = createApp()
app.use('/', eventHandler(() => 'Hello world!'))

listen(toNodeListener(app))
```
</details>

## Router

The `app` instance created by `h3` uses a middleware stack (see [how it works](#how-it-works)) with the ability to match route prefix and apply matched middleware.

To opt-in using a more advanced and convenient routing system, we can create a router instance and register it to app instance.

```ts
import { createApp, eventHandler, createRouter } from 'h3'

const app = createApp()

const router = createRouter()
 .get('/', eventHandler(() => 'Hello World!'))
 .get('/hello/:name', eventHandler(event => `Hello ${event.context.params.name}!`))

app.use(router)
```

**Tip:** We can register same route more than once with different methods.

Routes are internally stored in a [Radix Tree](https://en.wikipedia.org/wiki/Radix_tree) and matched using [unjs/radix3](https://github.com/unjs/radix3).

## More app usage examples

```js
// Handle can directly return object or Promise<object> for JSON response
app.use('/api', eventHandler((event) => ({ url: event.node.req.url }))

// We can have better matching other than quick prefix match
app.use('/odd', eventHandler(() => 'Is odd!'), { match: url => url.substr(1) % 2 })

// Handle can directly return string for HTML response
app.use(eventHandler(() => '<h1>Hello world!</h1>'))

// We can chain calls to .use()
app.use('/1', eventHandler(() => '<h1>Hello world!</h1>'))
   .use('/2', eventHandler(() => '<h1>Goodbye!</h1>'))

// Legacy middleware with 3rd argument are automatically promisified
app.use(fromNodeMiddleware((req, res, next) => { req.setHeader('x-foo', 'bar'); next() }))

// Lazy loaded routes using { lazy: true }
app.use('/big', () => import('./big-handler'), { lazy: true })
```

## Utilities

H3 has concept of compasable utilities that accept `event` (from `eventHandler((event) => {})`) as their first argument. This has several performance benefits over injecting them to `event` or `app` instances and global middleware commonly used in Node.js frameworks such as Express, which Only required code is evaluated and bundled and rest of utils can be tree-shaken when not used.

### Built-in

- `useRawBody(event, encoding?)`
- `useBody(event)`
- `useCookies(event)`
- `useCookie(event, name)`
- `setCookie(event, name, value, opts?)`
- `deleteCookie(event, name, opts?)`
- `useQuery(event)`
- `getRouterParams(event)`
- `send(event, data, type?)`
- `sendRedirect(event, location, code=302)`
- `getRequestHeaders(event, headers)` (alias: `getHeaders`)
- `getRequestHeader(event, name)` (alias: `getHeader`)
- `setResponseHeaders(event, headers)` (alias: `setHeaders`)
- `setResponseHeader(event, name, value)` (alias: `setHeader`)
- `appendResponseHeaders(event, headers)` (alias: `appendHeaders`)
- `appendResponseHeader(event, name, value)` (alias: `appendHeader`)
- `writeEarlyHints(event, links, callback)`
- `sendStream(event, data)`
- `sendError(event, error, debug?)`
- `useMethod(event, default?)`
- `isMethod(event, expected, allowHead?)`
- `assertMethod(event, expected, allowHead?)`
- `createError({ statusCode, statusMessage, data? })`
- `sendProxy(event, { target, headers?, fetchOptions?, fetch?, sendStream? })`
- `proxyRequest(event, { target, headers?, fetchOptions?, fetch?, sendStream? })`

👉 You can learn more about usage in [JSDocs Documentation](https://www.jsdocs.io/package/h3#package-functions).

### Add-ons

More composable utilities can be found in community packages.

- `validateBody(event, schema)` from [h3-typebox](https://github.com/kevinmarrec/h3-typebox)
- `validateQuery(event, schema)` from [h3-typebox](https://github.com/kevinmarrec/h3-typebox)
- `useValidatedBody(event, schema)` from [h3-zod](https://github.com/wobsoriano/h3-zod)
- `useValidatedQuery(event, schema)` from [h3-zod](https://github.com/wobsoriano/h3-zod)

## License

MIT
