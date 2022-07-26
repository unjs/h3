import { createError } from '../error'
import type { CompatibilityEvent } from '../event'
import { MIMES } from './consts'

const defer = typeof setImmediate !== 'undefined' ? setImmediate : (fn: Function) => fn()

export function send (event: CompatibilityEvent, data: any, type?: string): Promise<void> {
  if (type) {
    defaultContentType(event, type)
  }
  return new Promise((resolve) => {
    defer(() => {
      event.res.end(data)
      resolve(undefined)
    })
  })
}

export function defaultContentType (event: CompatibilityEvent, type?: string) {
  if (type && !event.res.getHeader('Content-Type')) {
    event.res.setHeader('Content-Type', type)
  }
}

export function sendRedirect (event: CompatibilityEvent, location: string, code = 302) {
  event.res.statusCode = code
  event.res.setHeader('Location', location)
  // minimal html document that redirects on client side
  const html = `<!DOCTYPE html>
<html>
  <head><meta http-equiv="refresh" content="0; url=${encodeURI(location)}"></head>
  <body>Redirecting to <a href=${JSON.stringify(location)}>${encodeURI(location)}</a></body>
</html>`
  return send(event, html, MIMES.html)
}

export function appendHeader (event: CompatibilityEvent, name: string, value: string): void {
  let current = event.res.getHeader(name)

  if (!current) {
    event.res.setHeader(name, value)
    return
  }

  if (!Array.isArray(current)) {
    current = [current.toString()]
  }

  event.res.setHeader(name, current.concat(value))
}

export function isStream (data: any) {
  return data && typeof data === 'object' && typeof data.pipe === 'function' && typeof data.on === 'function'
}

export function sendStream (event: CompatibilityEvent, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    data.pipe(event.res)
    data.on('end', () => resolve(undefined))
    data.on('error', (error: Error) => reject(createError(error)))
  })
}
