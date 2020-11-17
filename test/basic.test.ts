import { promisifyHandle } from '../src'
import { sendReq } from './utils'

describe('promisifyHandle', () => {
  test('handles exception', async () => {
    const h = promisifyHandle(() => { throw new Error('oops') })
    await expect(sendReq(h)).rejects.toThrow('oops')
  })

  test('handles exception (promise)', async () => {
    const h = promisifyHandle(() => { return Promise.reject(new Error('oops')) })
    await expect(sendReq(h)).rejects.toThrow('oops')
  })
})
