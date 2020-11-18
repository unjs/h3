import { RequestOptions } from '../types'
import { Request } from './request'
import { Response } from './response'

export function createRequest (ctx: RequestOptions) {
  const req = new Request()
  req.url = ctx.url || '/'
  req.method = ctx.method || 'GET'
  req.headers = ctx.headers || {}
  req.headers.host = req.headers.host || ctx.host || undefined
  // @ts-ignore encrypted is a tls-socket property
  req.connection.encrypted = req.connection.encrypted || ctx.protocol === 'https'
  return req
}

export function createResponse (request: Request) {
  return new Response(request)
}

export function createReqRes (ctx: any) {
  const req = createRequest(ctx)
  const res = createResponse(req)
  return { req, res }
}
