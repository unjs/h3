import { listen } from 'listhen'
import { createApp, createRouter } from '../src'

const app = createApp({ debug: true })
const router = createRouter()

app.use(router)

router.get('/', () => 'Hello World!')
router.get('/hello/:name', req => `Hello ${req.params.name}!`)

listen(app)
