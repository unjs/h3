# h2

[![npm](https://img.shields.io/npm/dm/h-2.svg?style=flat-square)](https://npmjs.com/package/h-2)
[![npm (scoped with tag)](https://img.shields.io/npm/v/h-2/latest.svg?style=flat-square)](https://npmjs.com/package/h-2)

> h2 is a 3 kB modern and environment agnostic http framework

**What?**

- Works perfectly with Serverless, Workers and Node.js
- Compatibile with connect/express middleware
- Tree-shakable and zero dependency
- Promise and `aync/await` support
- Lazy loading middleware
- Basic router

> See [un](https://github.com/nuxt-contrib/un) for workers support

## Install

```bash
yarn add @nuxt/h2
# or
or npm install @nuxt/h2
```

## Usage

```js
const { Server } = require('http')
const { createApp } = require('@nuxt/h2')

const app = createApp()
app.use('/', () => 'Hello world!')
app.use('/api', (req) => ({ url: req.url }))

const port = process.env.PORT || 3000
const server = new Server(app.handle)
server.listen(port, () => {
  console.log(`Listening on: http://localhost:${port}`
})
```

## utils

- `send (req, data, type)`
- `error (req, error, code)`
- `redirect (req, location, code)`
- `lazy (handle)`

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
