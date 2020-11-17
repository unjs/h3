const { createApp, listen } = require('../../dist')

const app = createApp()

app.use('/api', (req) => {
  return { route: req.url }
})

listen(app).then(({ url }) => {
  console.log(`Listening on ${url}`)
})
