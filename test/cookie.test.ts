import supertest, { SuperTest, Test } from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { createApp, App } from '../src'
import { setCookie, useCookie, useCookies } from '../src/utils/cookie'

describe('', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(app)
  })

  describe('useCookies', () => {
    it('can parse cookies', async () => {
      app.use('/', (request) => {
        const cookies = useCookies(request)
        expect(cookies).toEqual({ Authorization: '1234567' })
        return '200'
      })

      const result = await request
        .get('/')
        .set('Cookie', ['Authorization=1234567'])

      expect(result.text).toBe('200')
    })

    it('can parse empty cookies', async () => {
      app.use('/', (request) => {
        const cookies = useCookies(request)
        expect(cookies).toEqual({})
        return '200'
      })

      const result = await request
        .get('/')

      expect(result.text).toBe('200')
    })
  })

  describe('useCookie', () => {
    it('can parse cookie with name', async () => {
      app.use('/', (request) => {
        const authorization = useCookie(request, 'Authorization')
        expect(authorization).toEqual('1234567')
        return '200'
      })

      const result = await request
        .get('/')
        .set('Cookie', ['Authorization=1234567'])

      expect(result.text).toBe('200')
    })
  })

  describe('setCookie', () => {
    it('can set-cookie with setCookie', async () => {
      app.use('/', (_, response) => {
        setCookie(response, 'Authorization', '1234567', {})
        return '200'
      })
      const result = await request.get('/')
      expect(result.headers['set-cookie']).toEqual(['Authorization=1234567'])
      expect(result.text).toBe('200')
    })
  })
})
