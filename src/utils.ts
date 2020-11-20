import type { ServerResponse } from 'http'

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

export function error (res: ServerResponse, error: Error | string, debug?: boolean, code?: number) {
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

export function redirect (res: ServerResponse, location: string, code = 302) {
  res.statusCode = code
  res.setHeader('Location', location)
  defaultContentType(res, MIMES.html)
  res.end(location)
}
