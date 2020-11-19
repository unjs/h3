# h2

[![npm](https://img.shields.io/npm/dm/@nuxt/h2.svg?style=flat-square)](https://npmjs.com/package/@nuxt/h2)
[![npm (scoped with tag)](https://img.shields.io/npm/v/@nuxt/h2/latest.svg?style=flat-square)](https://npmjs.com/package/@nuxt/h2)

> h2 is a 3 kB modern and environment agnostic http framework

**What?**

- Works perfectly with Serverless, Workers and Node.js
- Compatibile with connect/express middleware
- Tree-shakable and zero dependency
- Promise and `aync/await` support
- Lazy loading
- Basic Router

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

app.use('/api', (req) => ({ url: req.url }))
app.use('/', () => 'Hello world!')

const port = process.env.PORT || 3000
const server = new Server(app.handle)
server.listen(port, () => {
  console.log(`Listening on: http://localhost:${port}`)
})
```

## utils

- `send (req, data, type)`
- `error (req, error, code)`
- `redirect (req, location, code)`
- `lazy (handle)`

## License

MIT
