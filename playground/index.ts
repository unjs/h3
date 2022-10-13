import { listen } from 'listhen'
import { createApp, createRouter, eventHandler, toNodeHandler, parseCookies } from '../src'

const app = createApp({ debug: true })
const router = createRouter()
  .get('/', eventHandler(() => 'Hello World!'))
  .get('/hello/:name', eventHandler((event) => {
    return `Hello ${parseCookies(event)}!`
  }))

app.use(router)

listen(toNodeHandler(app))
