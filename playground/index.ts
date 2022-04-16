import { listen } from 'listhen'
import { createApp, createRouter, sendStream } from '../src'
import fs from 'fs'

const app = createApp()
const router = createRouter()
  .get('/', () => 'Hello World!')
  .get('/hello/:name', event => `Hello ${event.context.params.name}!`)
  .get('/pixel', (event) => sendStream(event, fs.createReadStream("./playground/pixel.png")))

app.use(router)

listen(app)
