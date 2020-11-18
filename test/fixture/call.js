const { createApp, createCaller, callHandle } = require('../../dist')

const app = createApp()

app.use('/api', req => ({ url: req.url }))
app.use('/', () => 'Hello world!')

callHandle(app.handle, { url: '/' }).then(console.log)

// Method 2:
const caller = createCaller(app.handle)
caller({ url: '/api' }).then(console.log)
