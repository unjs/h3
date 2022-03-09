import { listen } from 'listhen'
import { createApp, createRouter } from '../src'

const app = createApp()
const router = createRouter()
  .get('/', () => 'Hello World!')
  .get('/hello/:name', req => `Hello ${req.params.name}!`)

app.use(router)

listen(app)
