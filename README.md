[![d](https://img.shields.io/npm/dm/h3.svg?style=flat-square)](https://npmjs.com/package/h3)
[![v](https://img.shields.io/npm/v/h3/latest.svg?style=flat-square)](https://npmjs.com/package/h3)
[![b](https://img.shields.io/bundlephobia/min/h3/latest.svg?style=flat-square)](https://bundlephobia.com/result?p=h3)
[![a](https://img.shields.io/github/workflow/status/unjs/h3/ci/main?style=flat-square)](https://github.com/unjs/h3/actions)
[![c](https://img.shields.io/codecov/c/gh/unjs/h3/main?style=flat-square)](https://codecov.io/gh/unjs/h3)

> H3 is a minimal h(ttp) framework built for high performance and portability

<!-- ![h3 - Tiny JavaScript Server](.github/banner.svg) -->

**Features**

✔️ **Portable:** Works perfectly in Serverless, Workers, and Node.js

✔️ **Compatible:** Support connect/express middleware

✔️ **Minimal:** Small, tree-shakable and zero-dependency

✔️ **Modern:** Native promise support

✔️**Extendable:** Ships with a set of composable utilities but can be extended

## Install

```bash
# Using npm
npm install h3

# Using yarn
yarn add h3
```

## Usage

```ts
import { createServer } from 'http'
import { createApp } from 'h3'

const app = createApp()
app.useAsync('/', () => 'Hello world!')

listen(app)
```

**Tip:** you may try [listhen](https://github.com/unjs/listhen) for a more elegant and advanced listener.

## Examples

```js
// Handle can directly return object or Promise<object> for JSON response
app.useAsync('/api', (req) => ({ url: req.url }))

// We can have better matching other than quick prefix match
app.useAsync('/odd', () => 'Is odd!', { match: url => url.substr(1) % 2 })

// Handle can directly return string for HTML response
app.useAsync(() => '<h1>Hello world!</h1>')

// We can chain calls to .use()
app.useAsync('/1', () => '<h1>Hello world!</h1>')
   .useAsync('/2', () => '<h1>Goodbye!</h1>')

// Promisify middleware before register: (supporting (req, res, next) format)
// app.use(async () => {})

// Lazy loaded routes using { lazy: true }
// app.use('/big', () => import('./big'), { lazy: true })
```

## Utilities

Instead of adding helpers to `req` and `res`, h3 exposes them as composable utilities.

- `useRawBody(req, encoding?)`
- `useBody(req)`
- `useCookies(req)`
- `useCookie(req, name)`
- `setCookie(req, name, value, opts?)`
- `useQuery(req)`
- `send(res, data, type?)`
- `sendRedirect(res, location, code=302)`
- `appendHeader(res, name, value)`
- `createError({ statusCode, statusMessage, data? }`
- `sendError(res, error, debug?)`

## How it works?

Using `createApp`, it returns a standard `(req, res)` handler function and internally an array called middleware stack. `useAsync()` and `use()` methods are helpers to add an item to this internal stack.

When a request comes, each stack item that matches the route will be called and resolved until [`res.writableEnded`](https://nodejs.org/api/http.html#http_response_writableended) flag is set, which means the response is sent. If `writableEnded` is not set after all middleware, a `404` error will be thrown. And if one of the stack items resolves to a value, it will be serialized and sent as response as a shorthand method to sending responses.

For maximum compatibility with connect/express middleware (`req, res, next?` signature), when using `use` instead of `useAsync`, it converts classic middleware into a promisified version ready to use with stack runner:

- If middleware has 3rd next/callback param, promise will `resolve/reject` when called
- If middleware returns a promise, it will be **chained** to the main promise
- If calling middleware throws an immediate error, promise will be rejected
- On `close` and `error` events of res, promise will `resolve/reject` (to ensure if middleware simply calls `res.end`)

## License

MIT
