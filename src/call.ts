import { Handle, RequestOptions } from './types'
import { promisifyHandle } from './promisify'
import { createReqRes } from './mock'

export function createCaller (handle: Handle) {
  const phandle = promisifyHandle(handle)
  return async function callHandle (options: RequestOptions) {
    const { req, res } = createReqRes(options)
    await phandle(req, res)
    return res._consume()
  }
}

export function callHandle (handle: Handle, options: RequestOptions) {
  return createCaller(handle)(options)
}
