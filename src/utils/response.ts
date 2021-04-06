import type { ServerResponse } from 'http'
import { MIMES } from './consts'

export function send (res: ServerResponse, data: any, type?: string) {
  if (type) {
    defaultContentType(res, type)
  }
  return new Promise((resolve) => {
    setImmediate(() => {
      res.end(data)
      resolve(undefined)
    })
  })
}

export function defaultContentType (res: ServerResponse, type?: string) {
  if (type && !res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', type)
  }
}

export function sendRedirect (res: ServerResponse, location: string, code = 302) {
  res.statusCode = code
  res.setHeader('Location', location)
  send(res, 'Redirecting to ' + location, MIMES.html)
}

export function appendHeader (res: ServerResponse, name: string, value: string): void {
  let current = res.getHeader(name)

  if (!current) {
    return res.setHeader(name, value)
  }

  if (!Array.isArray(current)) {
    current = [current.toString()]
  }

  res.setHeader(name, current.concat(value))
}
