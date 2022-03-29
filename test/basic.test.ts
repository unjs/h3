import { describe, it, expect } from 'vitest'
import { promisifyHandler } from '../src'

// import { sendReq } from './utils'
const sendReq = (_: any) => {}

describe.skip('promisifyHandler', () => {
  it('handles exception', async () => {
    const h = promisifyHandler(() => { throw new Error('oops') })
    await expect(sendReq(h)).rejects.toThrow('oops')
  })

  it('handles exception (promise)', async () => {
    const h = promisifyHandler(() => { return Promise.reject(new Error('oops')) })
    await expect(sendReq(h)).rejects.toThrow('oops')
  })
})
