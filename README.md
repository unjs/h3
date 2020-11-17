# h2

[![npm](https://img.shields.io/npm/dm/h-2.svg?style=flat-square)](https://npmjs.com/package/h-2)
[![npm (scoped with tag)](https://img.shields.io/npm/v/h-2/latest.svg?style=flat-square)](https://npmjs.com/package/h-2)

> H2 is a tree-shakable and super minimal http framework

- Zero dependency
- Add native promise support (`async` middleware)
- Compatibility with connect/express middleware
- Allow returning a value to respond with proper content-type
- Support lazy loading middleware
- Fully depending on node `IncomingMessage`/`ServerResponse` without any prototype modifications
- Exposing utils
- Works natively with Serverless and Workers
- Full http implementation layer for worker environments

## Installation

```bash
yarn add @nuxt/h2
# or
or npm install @nuxt/h2
```

## HTTP Server

```js
const { Server } = require('http')
const { createApp, listen } = require('@nuxt/h2')

const app = createApp()

app.use('/api', (req) => {
  return { route: req.url }
})

// honors process.env.PORT
listen().then(({ url }) => {
  console.log(`Listening on: ${url}`)
})
```

## Mocks

[ TODO ]

## `promisifyHandle`

Optionally you can use express or your own middleware system by directly using this utility.

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
