import { Request, Response, Handle } from '../src'

export function makeReq () {
  const req = new Request()
  const res = new Response(req)
  return { req, res }
}

export function sendReq (handle: Handle) {
  const { req, res } = makeReq()
  return handle(req, res)
}
