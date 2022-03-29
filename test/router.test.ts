import supertest, { SuperTest, Test } from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { createApp, createRouter, App, Router } from '../src'

describe('router', () => {
  let app: App
  let router: Router
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    router = createRouter()
      .add('/', () => 'Hello')
      .add('/test/?/a', () => '/test/?/a')
      .get('/test', () => 'Test (GET)')
      .post('/test', () => 'Test (POST)')

    app.use(router)
    request = supertest(app)
  })

  it('Handle route', async () => {
    const res = await request.get('/')
    expect(res.text).toEqual('Hello')
  })

  it('Handle different methods', async () => {
    const res1 = await request.get('/test')
    expect(res1.text).toEqual('Test (GET)')
    const res2 = await request.post('/test')
    expect(res2.text).toEqual('Test (POST)')
  })
  it('Handle url with query parameters', async () => {
    const res = await request.get('/test?title=test')
    expect(res.status).toEqual(200)
  })

  it('Handle url with query parameters, include "?" in url path', async () => {
    const res = await request.get('/test/?/a?title=test')
    expect(res.status).toEqual(200)
  })

  it('Not matching route', async () => {
    const res = await request.get('/404')
    expect(res.status).toEqual(404)
  })

  it('Not matching route method', async () => {
    const res = await request.head('/test')
    expect(res.status).toEqual(405)
  })
})
