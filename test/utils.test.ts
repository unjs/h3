import supertest, { SuperTest, Test } from 'supertest'
import { createApp, App, sendRedirect, useBase, useQuery } from '../src'

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
})
