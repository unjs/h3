import supertest, { SuperTest, Test } from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  createApp,
  App,
  getRequestHeaders,
  getHeaders,
  getRequestHeader,
  getHeader,
  setResponseHeaders,
  setHeaders,
  setResponseHeader,
  setHeader,
  appendResponseHeaders,
  appendHeaders,
  appendResponseHeader,
  appendHeader
} from '../src'

describe('', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(app)
  })

  describe('getRequestHeaders', () => {
    it('can return request headers', async () => {
      app.use('/', (request) => {
        const headers = getRequestHeaders(request)
        expect(headers).toEqual(request.headers)
      })
      await request.get('/').set('Accept', 'application/json')
    })
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

  describe('getRequestHeader', () => {
    it('can return a value of request header corresponding to the given name', async () => {
      app.use('/', (request) => {
        expect(getRequestHeader(request, 'accept')).toEqual('application/json')
        expect(getRequestHeader(request, 'Accept')).toEqual('application/json')
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

  describe('setResponseHeaders', () => {
    it('can set multiple values to multiple response headers corresponding to the given object', async () => {
      app.use('/', (request) => {
        setResponseHeaders(request, { 'Nuxt-HTTP-Header-1': 'string-value-1', 'Nuxt-HTTP-Header-2': 'string-value-2' })
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header-1']).toEqual('string-value-1')
      expect(result.headers['nuxt-http-header-2']).toEqual('string-value-2')
    })
  })

  describe('setHeaders', () => {
    it('can set multiple values to multiple response headers corresponding to the given object', async () => {
      app.use('/', (request) => {
        setHeaders(request, { 'Nuxt-HTTP-Header-1': 'string-value-1', 'Nuxt-HTTP-Header-2': 'string-value-2' })
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header-1']).toEqual('string-value-1')
      expect(result.headers['nuxt-http-header-2']).toEqual('string-value-2')
    })
  })

  describe('setResponseHeader', () => {
    it('can set a string value to response header corresponding to the given name', async () => {
      app.use('/', (request) => {
        setResponseHeader(request, 'Nuxt-HTTP-Header', 'string-value')
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header']).toEqual('string-value')
    })

    it('can set a number value to response header corresponding to the given name', async () => {
      app.use('/', (request) => {
        setResponseHeader(request, 'Nuxt-HTTP-Header', 12345)
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header']).toEqual('12345')
    })

    it('can set an array value to response header corresponding to the given name', async () => {
      app.use('/', (request) => {
        setResponseHeader(request, 'Nuxt-HTTP-Header', ['value 1', 'value 2'])
        setResponseHeader(request, 'Nuxt-HTTP-Header', ['value 3', 'value 4'])
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header']).toEqual('value 3, value 4')
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

  describe('appendResponseHeaders', () => {
    it('can append multiple string values to multiple response header corresponding to the given object', async () => {
      app.use('/', (request) => {
        appendResponseHeaders(request, { 'Nuxt-HTTP-Header-1': 'string-value-1-1', 'Nuxt-HTTP-Header-2': 'string-value-2-1' })
        appendResponseHeaders(request, { 'Nuxt-HTTP-Header-1': 'string-value-1-2', 'Nuxt-HTTP-Header-2': 'string-value-2-2' })
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header-1']).toEqual('string-value-1-1, string-value-1-2')
      expect(result.headers['nuxt-http-header-2']).toEqual('string-value-2-1, string-value-2-2')
    })
  })

  describe('appendHeaders', () => {
    it('can append multiple string values to multiple response header corresponding to the given object', async () => {
      app.use('/', (request) => {
        appendHeaders(request, { 'Nuxt-HTTP-Header-1': 'string-value-1-1', 'Nuxt-HTTP-Header-2': 'string-value-2-1' })
        appendHeaders(request, { 'Nuxt-HTTP-Header-1': 'string-value-1-2', 'Nuxt-HTTP-Header-2': 'string-value-2-2' })
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header-1']).toEqual('string-value-1-1, string-value-1-2')
      expect(result.headers['nuxt-http-header-2']).toEqual('string-value-2-1, string-value-2-2')
    })
  })

  describe('appendResponseHeader', () => {
    it('can append a value to response header corresponding to the given name', async () => {
      app.use('/', (request) => {
        appendResponseHeader(request, 'Nuxt-HTTP-Header', 'value 1')
        appendResponseHeader(request, 'Nuxt-HTTP-Header', 'value 2')
      })
      const result = await request.get('/')
      expect(result.headers['nuxt-http-header']).toEqual('value 1, value 2')
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
