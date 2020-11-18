# H2

[![npm](https://img.shields.io/npm/dm/h-2.svg?style=flat-square)](https://npmjs.com/package/h-2)
[![npm (scoped with tag)](https://img.shields.io/npm/v/h-2/latest.svg?style=flat-square)](https://npmjs.com/package/h-2)

> H2 is a modern and environment agnostic toolkit to create http servers

**What?**

- Works perfectly with Serverless, Workers and Node.js
- Compatibile with connect/express middleware
- Tree-shakable and zero dependency
- Promise and `aync/await` support
- Direct calling middleware without server
- ...

**Why?**

With arrival serverless platforms and [cloudflare workers](https://workers.cloudflare.com), typical
Node.js frameworks became inefficient since depending on LOTS of of `node_modules` and [NodeJS](https://nodejs.org) internals. On the other hands, writing platform dependent frameworks doesn't makes sense since this makes your code less portable, vendor locked-in an each requires a new ecosystem for utlities like auth, error handling, etc.

H2 solves this problem by only depending on NodeJS [IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) interface and emulating them when necessary with closest possible spec this way we have maximum ecosystem support with minimum emulation.


## Install

```bash
yarn add @nuxt/H2
# or
or npm install @nuxt/H2
```

## Requirements

H2 is intended to have zero assumptions about environment that you are targettting the code and only
 emulating what is required. Hence using a bundler (like Rollup or Webpack) and
 polyfills are still needed and recommended:

### NodeJS

Only if using `createFetch` and `fetchHandle` we need to polyfill [node-fetch](https://www.npmjs.com/package/node-fetch):

```js
const nodeFetch = require('node-fetch')

global.fetch = nodeFetch
global.Request = nodeFetch.Request
global.Response = nodeFetch.Response
global.Headers = nodeFetch.Headers
```

### Workers

For H2, we only need to polyfill [events](https://www.npmjs.com/package/events) but since usually
middleware are depending on NodeJS internals, it is highly recommended to configure bundlers to do it for all built-ins.


## Usage

Frist we need to create an app:

```js
const { createApp } = require('@nuxt/H2')

const app = createApp()

app.use('/api', (req) => ({ url: req.url }))
app.use('/', () => 'Hello world!')
```

## Direct Call

For serverless platforms and worker environments that we do not have access to `req` and `res` objects,
H2 provides an emulated interface with closest possible spec to directly call middleware and get response.

```js
const { createApp, createCaller, callHandle } = require('@nuxt/H2')

const app = createApp()
app.use('/api', (req) => ({ url: req.url }))
app.use('/', () => 'Hello world!')

// Method 1:
const response = await callHandle(app.handle, { url: '/' })
// {
//   statusCode: 200,
//   statusMessage: '',
//   headers: { 'content-type': 'text/html' },
//   data: 'Hello world!',
//   encoding: 'utf-8'
// }

// Method 2:
const caller = createCaller(app.handle)
const response = await callHandle(app.handle, { url: '/api' })
// {
//   statusCode: 200,
//   statusMessage: '',
//   headers: { 'content-type': 'application/json' },
//   data: '{\n  "url": ""\n}',
//   encoding: 'utf-8'
// }
```

## NodeJS Server

```js
const { Server } = require('http')
const { createApp } = require('@nuxt/H2')

const app = createApp()
app.use('/', () => 'Hello world!')
app.use('/api', (req) => ({ url: req.url }))

const port = process.env.PORT || 3000
const server = new Server(app.handle)
server.listen(port, () => {
  console.log(`Listening on: http://localhost:${port}`
})
```

## `promisifyHandle`

Optionally you can use express or your own middleware system by directly using this utility and not using app stack.

Converts handle/middleware into a promisified async version:

- Ensures if handle is an `async` function or returning `Promise`, error is passed to the next middleware
- If middleware supports a third param (`next` callback) it will be piped to the promise chain
- If middleware returns or calls `next(null, value)` it will be piped to the promise chain
  - Otherwise resolves promise to `response.writableEnded` to indicate response is ended or not

**Why?**

- Avoid unhandled promise rejections since developers usually create `async` middleware without handling errors
- Allow directly using any middleware (like `serve-static`) by awaiting on it
- Convert vanilla http server into a modern handler supporting async and json!

**Example:** Register middleware and ensure it is safe using async operations

```js
const express = require('express')

const app = express()

const test = async (req, res) => {
  await Promise.reject(new Error('oops!'))
}

app.use('/api/test', promisifyHandle(test))
```

**Example:** Use `serve-static` as an awaitable utility

```js
const serveStatic = promisifyHandle(require('serve-static'))
const served = await serveStatic(req, res)
```

## License

MIT
