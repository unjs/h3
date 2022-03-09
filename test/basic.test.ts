import { describe, it, expect } from 'vitest'
import { promisifyHandle } from '../src'

// import { sendReq } from './utils'
const sendReq = (_: any) => {}

describe.skip('promisifyHandle', () => {
  it('handles exception', async () => {
    const h = promisifyHandle(() => { throw new Error('oops') })
    await expect(sendReq(h)).rejects.toThrow('oops')
  })

  it('handles exception (promise)', async () => {
    const h = promisifyHandle(() => { return Promise.reject(new Error('oops')) })
    await expect(sendReq(h)).rejects.toThrow('oops')
  })
})
