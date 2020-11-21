import supertest, { SuperTest, Test } from 'supertest'
import { createApp, App } from '../src'

;(global.console.error as any) = jest.fn()

describe('lazy loading', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp()
    request = supertest(app)
  })

  const handlers = [['sync', () => 'lazy'], ['async', () => Promise.resolve('lazy')]] as const
  const kinds = [['default export', (handler: any) => ({ default: handler })], ['non-default export', (handler: any) => handler]] as const

  handlers.forEach(([type, handler]) => {
    kinds.forEach(([kind, resolution]) => {
      it(`can load ${type} handlers lazily from a ${kind}`, async () => {
        app.use('/big', () => Promise.resolve(resolution(handler)), { lazy: true })
        const result = await request.get('/big')

        expect(result.text).toBe('lazy')
      })

      it(`can handle ${type} functions that don't return promises from a ${kind}`, async () => {
        app.use('/big', () => (resolution(handler)), { lazy: true })
        const result = await request.get('/big')

        expect(result.text).toBe('lazy')
      })
    })
  })
})
