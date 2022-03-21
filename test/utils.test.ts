import supertest, { SuperTest, Test } from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { createApp, App, sendRedirect, useBase, useQuery, useMethod, assertMethod, guessMimeType, MIMES } from '../src'

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

  describe('guessMimeType', () => {
    it('string as html', () => {
      expect(guessMimeType('test')).toBe(MIMES.html)
    })
    it('objects as json', () => {
      expect(guessMimeType({ test: 'test' })).toBe(MIMES.json)
    })
    it('booleans as json', () => {
      expect(guessMimeType(true)).toBe(MIMES.json)
    })
    it('numbers as json', () => {
      expect(guessMimeType(123)).toBe(MIMES.json)
    })
    it('undefined is not matched', () => {
      expect(guessMimeType(undefined)).toBeUndefined()
    })
    it('symbol is not matched', () => {
      expect(guessMimeType(Symbol('test'))).toBeUndefined()
    })
  })
})
