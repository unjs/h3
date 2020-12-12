import supertest, { SuperTest, Test } from 'supertest'
import { createApp, App, createError } from '../src'

; (global.console.error as any) = jest.fn()

describe('error', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(app)
  })

  describe('sendError', () => {
    it('logs errors', async () => {
      app.use((_req) => {
        throw createError({ statusMessage: 'Unprocessable', statusCode: 422 })
      })
      const result = await request.get('/')

      expect(result.status).toBe(422)
    })

    it('returns errors', async () => {
      app.use((_req) => {
        throw createError({ statusMessage: 'Unprocessable', statusCode: 422 })
      })
      const result = await request.get('/')

      expect(result.status).toBe(422)
    })
  })

  describe('createError', () => {
    it('can send internal error', async () => {
      app.use('/', () => {
        throw createError({
          statusCode: 500,
          statusMessage: 'Internal Error',
          data: 'oops',
          internal: true
        })
      })
      const result = await request.get('/api/test')

      expect(result.status).toBe(500)
      // eslint-disable-next-line
      expect(console.error).toBeCalled()

      expect(JSON.parse(result.text)).toMatchObject({
        statusCode: 500,
        statusMessage: 'Internal Error'
      })
    })

    it('can send runtime error', async () => {
      jest.clearAllMocks()

      app.use('/', () => {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          data: {
            message: 'Invalid Input'
          }
        })
      })

      const result = await request.get('/api/test')

      expect(result.status).toBe(400)
      expect(result.type).toMatch('application/json')
      // eslint-disable-next-line
      expect(console.error).not.toBeCalled()

      expect(JSON.parse(result.text)).toMatchObject({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          message: 'Invalid Input'
        }
      })
    })
  })
})
