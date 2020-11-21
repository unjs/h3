# h2

[![d](https://img.shields.io/npm/dm/@nuxt/h2.svg?style=flat-square)](https://npmjs.com/package/@nuxt/h2)
[![v](https://img.shields.io/npm/v/@nuxt/h2/latest.svg?style=flat-square)](https://npmjs.com/package/@nuxt/h2)
[![b](https://img.shields.io/bundlephobia/min/@nuxt/h2/latest.svg?style=flat-square)](https://bundlephobia.com/result?p=@nuxt/h2)

> h2 is pure and modern JavaScript Server

**What?**

- Works perfectly with Serverless, Workers and NodeJS
- Compatibile with connect/express middleware
- Tree-shakable and zero dependency
- Promise and `aync/await` support
- Lazy Loading
- Quick prefix router
- Custom route matcher

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

// Handle can directly return object or Promise<object> for JSON response
app.use('/api', (req) => ({ url: req.url }))

// You can have better matching other than quick prefix match
app.use('/odd', () => 'Is odd!', { match: url => url.substr(1) % 2 })

// Handle can directly return string for HTML response
app.use(() => '<h1>Hello world!</h1>')

// If handle is already async, using useAsync to avoid unnecessary promisify wrapper
// (Shrotcut to pass { proimsify: false })
// app.useAsync(async () => {})

// Lazy loading routes using { lazy: true }
// app.use('/big', () => import('./big'), { lazy: true })

const port = process.env.PORT || 3000
const server = new Server(app.handle)

server.listen(port, () => {
  console.log(`Listening on: http://localhost:${port}`)
})
```

## Technical

There are two vital parts that make it working: Stack Runner (`App`), and `promisifyHandle`.

### App

App is basically a http server handle with `req, res` and attached utilities that runs stack
 of middleware/handles in parallel. It will stop iteration in case of `writableEnded` flag is set on response
 (which means `res.end` called) and throw 404 if `writableEnded` flag is not set at the end.

Additionally app, has a quick prefix matcher and will automatically call `res.end` in case of any stack layers returning a value.

### `promisifyHandle`

Converts a classic middleware (`req, res, next?`) into promisifier version ready to use with App

- If middleware has 3rd next/callback param, promise will `resolve/reject` when being called
- If middleware returns a promise, it will be **chained** to main promise
- If calling middleware throws an immediate error, promise will be rejected
- On `close` and `close` events of res, promise will `resolve/reject` (to ensure if middleware simply calls `res.end`)

When calling `app.use`, middleware will be automatically promisified.
If you are already making an async aware middleware, can use `app.useAsync`

## License

MIT
