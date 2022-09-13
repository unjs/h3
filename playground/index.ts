import { listen } from 'listhen'
import { createApp, createRouter, nodeHandler } from '../src'

const app = createApp()
const router = createRouter()
  .get('/', () => 'Hello World!')
  .get('/hello/:name', event => `Hello ${event.context.params.name}!`)

app.use(router)

listen(nodeHandler(app))
