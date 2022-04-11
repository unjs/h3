import supertest, { SuperTest, Test } from 'supertest'
import { describe, it, expect, beforeEach, fn } from 'vitest'
import { createApp, App, createError } from '../src'

const consoleMock = (global.console.error as any) = fn()

describe('error', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(app)
  })

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

  it('can send internal error', async () => {
    app.use('/', () => {
      throw new Error('Booo')
    })
    const result = await request.get('/api/test')

    expect(result.status).toBe(500)
    expect(JSON.parse(result.text)).toMatchObject({
      statusCode: 500,
      statusMessage: 'H3Error'
    })
  })

  it('can send runtime error', async () => {
    consoleMock.mockReset()

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

  it('can handle errors in promises', async () => {
    app.use('/', () => { throw new Error('failed') })

    const res = await request.get('/')
    expect(res.status).toBe(500)
  })

  it('can handle returned Error', async () => {
    app.use('/', () => new Error('failed'))

    const res = await request.get('/')
    expect(res.status).toBe(500)
  })

  it('can handle returned H3Error', async () => {
    app.use('/', () => createError({ statusCode: 501 }))

    const res = await request.get('/')
    expect(res.status).toBe(501)
  })
})
