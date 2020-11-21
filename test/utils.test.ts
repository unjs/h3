import supertest, { SuperTest, Test } from 'supertest'
import { createApp, App, sendError, sendRedirect, useBase } from '../src'

;(global.console.error as any) = jest.fn()

describe('', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp()
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

  describe('sendError', () => {
    it('logs errors', async () => {
      app.use((_req, res) => sendError(res, 'Unprocessable', undefined, 422))
      const result = await request.get('/')

      expect(result.status).toBe(422)
    })
  })

  describe('sendError', () => {
    it('returns errors', async () => {
      app.use((_req, res) => sendError(res, 'Unprocessable', undefined, 422))
      const result = await request.get('/')

      expect(result.status).toBe(422)
    })

    it('logs errors in debug mode', async () => {
      app.use((_req, res) => sendError(res, 'Unprocessable', true, 422))
      const result = await request.get('/')

      expect(result.status).toBe(422)
      // eslint-disable-next-line
      expect(console.error).toBeCalled()
    })
  })

  describe('useBase', () => {
    it('can prefix routes', async () => {
      app.use('/', useBase('/api', req => Promise.resolve(req.url || 'none')))
      const result = await request.get('/api/test')

      expect(result.text).toBe('/test')
    })
  })
})
