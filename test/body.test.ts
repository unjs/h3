import supertest, { SuperTest, Test } from 'supertest'
import { createApp, App, useBody, useRawBody } from '../src'

describe('', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(app)
  })

  describe('useRawBody', () => {
    it('can handle raw string', async () => {
      app.use('/', async (request) => {
        const body = await useRawBody(request)
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

  describe('useJSON', () => {
    it('can parse json payload', async () => {
      app.use('/', async (request) => {
        const body = await useBody(request)
        expect(body).toMatchObject({
          bool: true,
          name: 'string',
          number: 1
        })
        return '200'
      })
      const result = await request.post('/api/test')
        .send({
          bool: true,
          name: 'string',
          number: 1
        })

      expect(result.text).toBe('200')
    })
  })

  describe('useUrlEncoded', () => {
    it('not parse the form encoded', async () => {
      app.use('/', async (request) => {
        const body = await useBody(request)
        expect(body).toMatch('field=value&another=1')
        return '200'
      })
      const result = await request.post('/api/test')
        .send('field=value&another=1')

      expect(result.text).toBe('200')
    })

    it('parse the form encoded into an object', async () => {
      app.use('/', async (request) => {
        const body = await useBody(request, {
          parseBody: {
            formUrlEncoded: true
          }
        })
        expect(body).toMatchObject({
          field: 'value',
          another: 'true',
          number: '20'
        })
        return '200'
      })
      const result = await request.post('/api/test')
        .send('field=value&another=true&number=20')

      expect(result.text).toBe('200')
    })
  })
})
