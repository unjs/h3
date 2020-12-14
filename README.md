![h2](https://user-images.githubusercontent.com/904724/101663332-dfb36900-3a4a-11eb-9d1f-f847893446a0.png)

# h2

[![d](https://img.shields.io/npm/dm/@nuxt/h2.svg?style=flat-square)](https://npmjs.com/package/@nuxt/h2)
[![v](https://img.shields.io/npm/v/@nuxt/h2/latest.svg?style=flat-square)](https://npmjs.com/package/@nuxt/h2)
[![b](https://img.shields.io/bundlephobia/min/@nuxt/h2/latest.svg?style=flat-square)](https://bundlephobia.com/result?p=@nuxt/h2)
[![a](https://img.shields.io/github/workflow/status/nuxt-contrib/h2/ci/main?style=flat-square)](https://github.com/nuxt-contrib/h2/actions)
[![c](https://img.shields.io/codecov/c/gh/nuxt-contrib/h2/main?style=flat-square)](https://codecov.io/gh/nuxt-contrib/h2)
> Tiny JavaScript Server

**What?**

- Works perfectly with Serverless, Workers and NodeJS
- Compatible with connect/express middleware
- Tree-shakable and zero-dependency
- Promise and `aync/await` support
- Lazy loading
- Quick prefix router
- Custom route matcher

> See [un](https://github.com/nuxt-contrib/un) for workers support

## Install

```bash
yarn add @nuxt/h2
# or
npm install @nuxt/h2
```

## Usage

**Using [listhen](https://github.com/nuxt-contrib/listhen):**

```js
const { createApp } = require('@nuxt/h2')
const { listen } = require('listhen')

const app = createApp()
app.use('/', () => 'Hello world!')

listhen(app)
```

**Using plain node:**

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

// You can chain calls to .use()
app.use('/1', () => '<h1>Hello world!</h1>').use('/2', () => '<h1>Goodbye!</h1>')

// If handle is already async, using useAsync to avoid unnecessary promisify wrapper
// (Shortcut to pass { promisify: false })
// app.useAsync(async () => {})

// Lazy loading routes using { lazy: true }
// app.use('/big', () => import('./big'), { lazy: true })

const port = process.env.PORT || 3000
const server = new Server(app)

server.listen(port, () => {
  console.log(`Listening on: http://localhost:${port}`)
})
```

## Technical

There are two vital parts that make it working: Stack Runner (`App`), and `promisifyHandle`.

### App

App is basically a http server handle with `req, res` and attached utilities that runs a stack
 of middleware/handles in parallel. It will stop when the `writableEnded` flag is set on a response
 (which means that `res.end` has been called) and throw a 404 if `writableEnded` flag has not been set by the end.

Additionally the app has a quick prefix matcher and will automatically call `res.end` if any stack layers return a value.

### `promisifyHandle`

Converts a classic middleware (`req, res, next?`) into a promisified version ready to use with App

- If middleware has 3rd next/callback param, promise will `resolve/reject` when called
- If middleware returns a promise, it will be **chained** to main promise
- If calling middleware throws an immediate error, promise will be rejected
- On `close` and `error` events of res, promise will `resolve/reject` (to ensure if middleware simply calls `res.end`)

When calling `app.use`, middleware will be automatically promisified.

If you are already making an async aware middleware, you can use `app.useAsync`

## Utilities

`h2` provides multiple utility functions.

### `useQuery`

Parse query parametes of the request and returns equivalent object.

```js
import { useQuery } from '@nuxt/h2';

app.use('/api', (req) => ({ query: useQuery(req) }))
```

Response value of above handler for url `/api?hello=world&array[]=one&array=two` will be:
```
{
  query: {
    "hello": "world",
    "array": ["one", "two"]
  }
}
```

### `useBody`

Reads body of the request and returns encoded raw string or `Buffer`.

```js
import { useBody } from '@nuxt/h2';

app.use('/api', (req) => {
  const bodyString = useBody(req) // returns `utf-8` encoded string

  const bodyBuffer = useBody(req, false)
  
  return bodyString
})
```

### `useBodyJSON`

Reads body of the request and returns equivalent JSON. It uses [destr](https://github.com/nuxt-contrib/destr) to parse body.

```js
import { useBodyJSON } from '@nuxt/h2';

app.use('/api', (req) => {
  const bodyJSON = useBodyJSON(req)

  return bodyJSON
})
```

### `createError`

This utility creates new `Error` that can be used to handle both internal and runtime errors like validation errors.

```js
import { useBodyJSON, createError } from '@nuxt/h2';

app.use('/api', (req) => {
  const bodyJSON = useBodyJSON(req)
  if (!bodyJSON.username) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        "message": "username is required"
      }
    })
  }
  // ...
})
```



## License

MIT
