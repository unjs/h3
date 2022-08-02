import supertest, { SuperTest, Test } from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { createApp, App, getHeaders, getHeader, setHeader, appendHeader } from '../src'

describe('', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(app)
  })

  describe('getHeaders', () => {
    it('can return request headers', async () => {
      app.use('/', (request) => {
        const headers = getHeaders(request)
        expect(headers).toEqual(request.headers)
      })
      await request.get('/').set('Accept', 'application/json')
    })
  })

  describe('getHeader', () => {
    it('can return a value of request header corresponding to the given name', async () => {
      app.use('/', (request) => {
        expect(getHeader(request, 'accept')).toEqual('application/json')
        expect(getHeader(request, 'Accept')).toEqual('application/json')
      })
      await request.get('/').set('Accept', 'application/json')
    })
  })

  describe('setHeader', () => {
    it('can set a string value to response header corresponding to the given name', async () => {
      app.use('/', (request) => {
        setHeader(request, 'Nuxt-HTTP-Header', 'string-value')
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header']).toEqual('string-value')
    })

    it('can set a number value to response header corresponding to the given name', async () => {
      app.use('/', (request) => {
        setHeader(request, 'Nuxt-HTTP-Header', 12345)
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header']).toEqual('12345')
    })

    it('can set an array value to response header corresponding to the given name', async () => {
      app.use('/', (request) => {
        setHeader(request, 'Nuxt-HTTP-Header', ['value 1', 'value 2'])
        setHeader(request, 'Nuxt-HTTP-Header', ['value 3', 'value 4'])
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header']).toEqual('value 3, value 4')
    })
  })

  describe('appendHeader', () => {
    it('can append a value to response header corresponding to the given name', async () => {
      app.use('/', (request) => {
        appendHeader(request, 'Nuxt-HTTP-Header', 'value 1')
        appendHeader(request, 'Nuxt-HTTP-Header', 'value 2')
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header']).toEqual('value 1, value 2')
    })
  })
})
