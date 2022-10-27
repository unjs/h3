import supertest, { SuperTest, Test } from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { fetch } from 'node-fetch-native'
import { createApp, toNodeListener, App, eventHandler } from '../src'
import { sendProxy } from '../src/utils/proxy'

describe('', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(toNodeListener(app))
  })

  describe('sendProxy', () => {
    it('can sendProxy', async () => {
      app.use('/', eventHandler((event) => {
        return sendProxy(event, 'https://example.com', { fetch })
      }))

      const result = await request
        .get('/')

      expect(result.text).toContain('a href="https://www.iana.org/domains/example">More information...</a>')
    })
  })
})
