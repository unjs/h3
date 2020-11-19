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
  res.statusCode = code || (res.statusCode !== 200)
    ? res.statusCode
    // @ts-ignore
    : (error.status || error.statusCode || 500)

  if (debug) {
    console.error(error) // eslint-disable-line no-console
  }

  res.end(`"Internal Error (${res.statusCode})"`)
}

export function redirect (res: ServerResponse, location: string, code = 302) {
  res.statusCode = code
  res.setHeader('Location', location)
  defaultContentType(res, MIMES.html)
  res.end(location)
}
