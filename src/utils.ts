import type { ServerResponse } from 'http'
import { LazyHandle, Handle } from './types'

export const MIMES = {
  html: 'text/html',
  json: 'application/json'
}

export function send (res: ServerResponse, data: string, type: string) {
  defaultContentType(res, type)
  res.end(data)
}

export function defaultContentType (res: ServerResponse, type: string) {
  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', type)
  }
}

export function error (res: ServerResponse, data: string, code: number = 500) {
  code = res.statusCode = (res.statusCode === 200) ? code : res.statusCode
  res.end(code + ': ' + data)
}

export function redirect (res: ServerResponse, location: string, code = 302) {
  res.statusCode = code
  res.setHeader('Location', location)
  defaultContentType(res, MIMES.html)
  res.end(location)
}

export function lazy (handle: LazyHandle): Handle {
  let _promise: Promise<Handle>
  const resolve = () => (
    _promise = _promise ||
    Promise.resolve(handle()).then((r: any) => r.default || r)
  )
  return function _lazy (req, res) {
    return resolve().then(h => h(req, res))
  }
}
