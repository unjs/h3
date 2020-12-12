import { listen } from 'listhen'
import { createApp } from '../src'

const app = createApp({ debug: true })

app.use('/', () => {
  throw new Error('Foo bar')
  return 'Hi!'
})

listen(app)
