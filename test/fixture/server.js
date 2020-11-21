const { Server } = require('http')
const express = require('express')
const { createApp } = require('jiti')(__dirname)('../../src')

function createExpress () {
  const app = express()
  app.use('/', (_req, res) => {
    res.json({ express: 'works' })
  })
  return app
}

const app = createApp()

app.use('/api/hello', req => ({ url: req.url }))
app.use('/api/express', createExpress())
app.use('/api', (_req, res) => { res.end('API root') })
app.use('/odd', () => 'Is odd!', { match: url => url.substr(1) % 2 })
app.use('/', () => 'Hello world!')

const port = process.env.PORT || 3000
const server = new Server(app.handle)
server.listen(port, () => {
  console.log(`Listening on: http://localhost:${port}`)
})
