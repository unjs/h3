import supertest, { SuperTest, Test } from 'supertest'
import { createApp, App } from '../src'

describe('app', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(app)
  })

  it('can return JSON directly', async () => {
    app.use('/api', req => ({ url: req.url }))
    const res = await request.get('/api')

    expect(res.body).toEqual({ url: '/' })
  })

  it('can return HTML directly', async () => {
    app.use(() => '<h1>Hello world!</h1>')
    const res = await request.get('/')

    expect(res.text).toBe('<h1>Hello world!</h1>')
    expect(res.header['content-type']).toBe('text/html')
  })

  it('allows overriding Content-Type', async () => {
    app.use((_req, res) => {
      res.setHeader('Content-Type', 'text/xhtml')
      return '<h1>Hello world!</h1>'
    })
    const res = await request.get('/')

    expect(res.header['content-type']).toBe('text/xhtml')
  })

  it('can match simple prefixes', async () => {
    app.use('/1', () => 'prefix1')
    app.use('/2', () => 'prefix2')
    const res = await request.get('/2')

    expect(res.text).toBe('prefix2')
  })

  it('can chain .use calls', async () => {
    app.use('/1', () => 'prefix1').use('/2', () => 'prefix2')
    const res = await request.get('/2')

    expect(res.text).toBe('prefix2')
  })

  it('can use async routes', async () => {
    app.use('/promise', async () => {
      return await Promise.resolve('42')
    })

    // eslint-disable-next-line
    app.use(async (_req, _res, next) => {
      next()
    })

    const res = await request.get('/promise')
    expect(res.text).toBe('42')
  })

  it('can use route arrays', async () => {
    app.use(['/1', '/2'], () => 'valid')

    const responses = [
      await request.get('/1'),
      await request.get('/2')
    ].map(r => r.text)
    expect(responses).toEqual(['valid', 'valid'])
  })

  it('can use handler arrays', async () => {
    app.use('/', [
      (_req, _res, next) => { next() },
      (_req, _res, next) => next(),
      // eslint-disable-next-line
      async (_req, _res, next) => { next() },
      () => 'valid'
    ])

    const response = await request.get('/')
    expect(response.text).toEqual('valid')
  })

  it('prohibits use of next() in non-promisified handlers', () => {
    app.use('/', (_req, _res, next) => next())
  })

  it('handles next() call with no routes matching', async () => {
    app.use('/', (_req, _res, next) => next())
    app.use('/', () => {})

    const response = await request.get('/')
    expect(response.status).toEqual(404)
  })

  it('can take an object', async () => {
    app.use({ route: '/', handle: () => 'valid' })

    const response = await request.get('/')
    expect(response.text).toEqual('valid')
  })

  it('can short-circuit route matching', async () => {
    app.use((_req, res) => { res.end('done') })
    app.use(() => 'valid')

    const response = await request.get('/')
    expect(response.text).toEqual('done')
  })

  it('can use a custom matcher', async () => {
    app.use('/odd', () => 'Is odd!', { match: url => Boolean(Number(url.substr(1)) % 2) })

    const res = await request.get('/odd/41')
    expect(res.text).toBe('Is odd!')

    const notFound = await request.get('/odd/2')
    expect(notFound.status).toBe(404)
  })

  it('can normalise route definitions', async () => {
    app.use('/test/', () => 'valid')

    const res = await request.get('/test')
    expect(res.text).toBe('valid')
  })
})
