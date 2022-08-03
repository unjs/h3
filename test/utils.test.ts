import supertest, { SuperTest, Test } from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { createApp, createRouter, App, sendRedirect, useBase, useQuery, getRouterParams, useRouterParams, useMethod, assertMethod } from '../src'

describe('', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(app)
  })

  describe('sendRedirect', () => {
    it('can redirect URLs', async () => {
      app.use((_req, res) => sendRedirect(res, 'https://google.com'))
      const result = await request.get('/')

      expect(result.header.location).toBe('https://google.com')
      expect(result.header['content-type']).toBe('text/html')
    })
  })

  describe('useBase', () => {
    it('can prefix routes', async () => {
      app.use('/', useBase('/api', req => Promise.resolve(req.url || 'none')))
      const result = await request.get('/api/test')

      expect(result.text).toBe('/test')
    })
    it('does nothing when not provided a base', async () => {
      app.use('/', useBase('', req => Promise.resolve(req.url || 'none')))
      const result = await request.get('/api/test')

      expect(result.text).toBe('/api/test')
    })
  })

  describe('useQuery', () => {
    it('can parse query params', async () => {
      app.use('/', (request) => {
        const query = useQuery(request)
        expect(query).toMatchObject({
          bool: 'true',
          name: 'string',
          number: '1'
        })
        return '200'
      })
      const result = await request.get('/api/test?bool=true&name=string&number=1')

      expect(result.text).toBe('200')
    })
  })

  describe('getRouterParams', () => {
    it('can return router params', async () => {
      const router = createRouter().get('/api/test/:name', (request) => {
        const params = getRouterParams(request)
        expect(params).toMatchObject({ name: 'string' })
        return '200'
      })
      app.use(router)
      const result = await request.get('/api/test/string')

      expect(result.text).toBe('200')
    })

    it('can return an empty object if router is not used', async () => {
      app.use('/', (request) => {
        const params = getRouterParams(request)
        expect(params).toMatchObject({})
        return '200'
      })
      const result = await request.get('/')

      expect(result.text).toBe('200')
    })
  })

  describe('useRouterParams', () => {
    it('can return router params', async () => {
      const router = createRouter().get('/api/test/:name', (request) => {
        const query = useRouterParams(request)
        expect(query).toMatchObject({ name: 'string' })
        return '200'
      })
      app.use(router)
      const result = await request.get('/api/test/string')

      expect(result.text).toBe('200')
    })

    it('can return an empty object if router is not used', async () => {
      app.use('/', (request) => {
        const params = useRouterParams(request)
        expect(params).toMatchObject({})
        return '200'
      })
      const result = await request.get('/')

      expect(result.text).toBe('200')
    })
  })

  describe('useMethod', () => {
    it('can get method', async () => {
      app.use('/', req => useMethod(req))
      expect((await request.get('/api')).text).toBe('GET')
      expect((await request.post('/api')).text).toBe('POST')
    })
  })

  describe('assertMethod', () => {
    it('only allow head and post', async () => {
      app.use('/post', (req) => { assertMethod(req, 'POST', true); return 'ok' })
      expect((await request.get('/post')).status).toBe(405)
      expect((await request.post('/post')).status).toBe(200)
      expect((await request.head('/post')).status).toBe(200)
    })
  })
})
