import type { ServerResponse } from 'http'
import { PHandle } from './types'

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

export function sendError (res: ServerResponse, error: Error | string, code?: number, debug: boolean = true) {
  res.statusCode = code ||
    (res.statusCode !== 200 && res.statusCode) ||
    // @ts-ignore
    error.statusCode || error.status ||
    500

  if (debug && res.statusCode !== 404) {
    console.error(error) // eslint-disable-line no-console
  }

  // @ts-ignore
  res.statusMessage = res.statusMessage || error.statusMessage || error.statusText || 'Internal Error'

  res.end(`"${res.statusMessage} (${res.statusCode})"`)
}

export function createError (statusCode: number, statusMessage: string) {
  const err = new Error(statusMessage)
  // @ts-ignore
  err.statusCode = statusCode
  // @ts-ignore
  err.statusMessage = statusMessage
  return err
}

export function sendRedirect (res: ServerResponse, location: string, code = 302) {
  res.statusCode = code
  res.setHeader('Location', location)
  defaultContentType(res, MIMES.html)
  res.end(location)
}

export function stripTrailingSlash (str: string = '') {
  return str.endsWith('/') ? str.slice(0, -1) : str
}

export function useBase (base: string, handle: PHandle): PHandle {
  base = stripTrailingSlash(base)
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
