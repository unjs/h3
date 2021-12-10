import supertest, { SuperTest, Test } from 'supertest'
import { createApp, App } from '../src'

describe('params', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(app)
  })

  it('can match a mandatory param', async () => {
    app.use('/api/:foo', req => req.params)
    const res = await request.get('/api/bar')

    expect(res.body).toEqual({ foo: 'bar' })
  })

  it('can match an optional param', async () => {
    app.use('/api/:foo?', req => req.params)
    const res1 = await request.get('/api/bar')

    expect(res1.body).toEqual({ foo: 'bar' })

    const res2 = await request.get('/api')

    expect(res2.body).toEqual({ })
  })

  it('can match multiple params', async () => {
    app.use('/api/:foo/:bar', req => req.params)
    const res = await request.get('/api/bar/foo')

    expect(res.body).toEqual({ foo: 'bar', bar: 'foo' })
  })

  it('can match numeric params', async () => {
    app.use('/api/([0-9]+)', req => req.params)
    const res1 = await request.get('/api/bar')
    expect(res1.statusCode).toEqual(404)
    const res2 = await request.get('/api/1')
    expect(res2.body).toEqual({ 0: '1' })
  })

  it('can match named regexp params', async () => {
    app.use('/api/foo([0-9]+)', req => req.params)
    const res = await request.get('/api/1')
    expect(res.body).toEqual({ foo: '1' })
  })
})
