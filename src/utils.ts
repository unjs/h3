import type { ServerResponse, IncomingMessage } from 'http'

import { withoutTrailingSlash, getParams } from '@nuxt/ufo'
import { PHandle } from './types'

export const MIMES = {
  html: 'text/html',
  json: 'application/json'
}

export function send (res: ServerResponse, data: any, type?: string) {
  if (type) {
    defaultContentType(res, type)
  }
  res.end(data)
}

export function defaultContentType (res: ServerResponse, type?: string) {
  if (type && !res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', type)
  }
}

export function sendRedirect (res: ServerResponse, location: string, code = 302) {
  res.statusCode = code
  res.setHeader('Location', location)
  defaultContentType(res, MIMES.html)
  res.end(location)
}

export function useBase (base: string, handle: PHandle): PHandle {
  base = withoutTrailingSlash(base)
  if (!base) { return handle }
  return function (req, res) {
    (req as any).originalUrl = (req as any).originalUrl || req.url || '/'
    req.url = req.url || ''
    if (req.url.startsWith(base)) {
      req.url = req.url.substr(base.length) || '/'
    }
    return handle(req, res)
  }
}

export function useQuery (req: IncomingMessage) {
  return getParams(req.url || '')
}
