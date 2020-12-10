import supertest, { SuperTest, Test } from 'supertest'
import { createApp, App, sendError, createError, sendRedirect, stripTrailingSlash, useBase, getBody, MIMES, getJSON } from '../src'

;(global.console.error as any) = jest.fn()

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

  describe('sendError', () => {
    it('logs errors', async () => {
      app.use((_req, res) => sendError(res, 'Unprocessable', 422))
      const result = await request.get('/')

      expect(result.status).toBe(422)
    })
  })

  describe('sendError', () => {
    it('returns errors', async () => {
      app.use((_req, res) => sendError(res, 'Unprocessable', 422))
      const result = await request.get('/')

      expect(result.status).toBe(422)
    })

    it('logs errors in debug mode', async () => {
      app.use((_req, res) => sendError(res, 'Unprocessable', 422, true))
      const result = await request.get('/')

      expect(result.status).toBe(422)
      // eslint-disable-next-line
      expect(console.error).toBeCalled()
    })
  })

  describe('stripTrailingSlash', () => {
    it('can normalise strings', () => {
      const results = [
        stripTrailingSlash('/test'),
        stripTrailingSlash('/test/'),
        stripTrailingSlash()
      ]

      expect(results).toEqual(['/test', '/test', ''])
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

  describe('getBody', () => {
    it('can parse json payload', async () => {
      app.use('/', async (request) => {
        const body = await getJSON(request)
        expect(body).toMatchObject({
          bool: true,
          name: 'string',
          number: 1
        })
        return '200'
      })
      const result = await request.post('/api/test').send({
        bool: true,
        name: 'string',
        number: 1
      })

      expect(result.text).toBe('200')
    })

    it('can handle raw string', async () => {
      app.use('/', async (request) => {
        const body = await getBody(request)
        expect(body).toEqual('{"bool":true,"name":"string","number":1}')
        return '200'
      })
      const result = await request.post('/api/test').send(JSON.stringify({
        bool: true,
        name: 'string',
        number: 1
      }))

      expect(result.text).toBe('200')
    })
  })

  describe('createError', () => {
    it('can sent internal error', async () => {
      app.use('/', () => {
        throw createError({
          statusCode: 500,
          statusMessage: 'Internal error',
          body: 'oops',
          internal: true
        })
      })
      const result = await request.get('/api/test')

      expect(result.status).toBe(500)
      // eslint-disable-next-line
      expect(console.error).toBeCalled()

      expect(result.text).toBe(JSON.stringify({
        statusCode: 500,
        statusMessage: 'Internal error'
      }))
    })

    it('can sent runtime error', async () => {
      jest.clearAllMocks()

      app.use('/', () => {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          body: {
            message: 'Invalid Input'
          },
          runtime: true
        })
      })
      const result = await request.get('/api/test')

      expect(result.status).toBe(400)
      expect(result.type).toBe(MIMES.json)
      // eslint-disable-next-line
      expect(console.error).not.toBeCalled()

      expect(result.text).toBe(JSON.stringify({
        message: 'Invalid Input'
      }))
    })
  })
})
