import express from 'express'

import supertest, { SuperTest, Test } from 'supertest'
import { createApp, App } from '../src'

function createExpress () {
  const app = express()
  app.use('/', (_req, res) => {
    res.json({ express: 'works' })
  })
  return app
}

describe('integrations with other frameworks', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp()
    request = supertest(app)
  })

  it('can wrap an express instance', async () => {
    app.use('/api/express', createExpress())
    const res = await request.get('/api/express')

    expect(res.body).toEqual({ express: 'works' })
  })

  it('can be used as express middleware', async () => {
    const expressApp = express()
    app.use('/api/hello', (_req, res, next) => {
      ;(res as any).prop = '42'
      next()
    })
    app.use('/api/hello', (req, res) => ({ url: req.url, prop: (res as any).prop }))
    expressApp.use(app)

    const res = await request.get('/api/hello')

    expect(res.body).toEqual({ url: '/', prop: '42' })
  })
})
