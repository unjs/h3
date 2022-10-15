import { listen } from 'listhen'
import { createApp, createRouter, eventHandler, toNodeListener, parseCookies, createError } from '../src'

const app = createApp({ debug: true })
const router = createRouter()
  .get('/', eventHandler(() => 'Hello World!'))
  .get('/error/:code', eventHandler((event) => {
    throw createError({ statusCode: parseInt(event.context.params.code) })
  }))
  .get('/hello/:name', eventHandler((event) => {
    return `Hello ${parseCookies(event)}!`
  }))

app.use(router)

listen(toNodeListener(app))
