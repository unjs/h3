import { Handle, CallContext } from './types'
import { promisifyHandle } from './promisify'
import { IncomingMessage, ServerResponse } from './node'

export function createCaller (handle: Handle) {
  const phandle = promisifyHandle(handle)
  return function callHandle (ctx: CallContext) {
    const { req, res } = createRequest(ctx)
    return phandle(req, res)
  }
}

export function callHandle (handle: Handle, ctx: CallContext) {
  return createCaller(handle)(ctx)
}

export function createRequest (ctx: CallContext) {
  const req = new IncomingMessage()
  const res = new ServerResponse(req)

  req.url = ctx.url || '/'
  req.method = ctx.method || 'GET'
  req.headers = ctx.headers || {}
  req.headers.host = req.headers.host || ctx.host || undefined

  // @ts-ignore
  req.context = ctx

  // @ts-ignore encrypted is a tls-socket property
  req.connection.encrypted = req.connection.encrypted || ctx.protocol === 'https'

  return { req, res }
}
