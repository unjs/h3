import { createError } from '../error'
import type { H3CompatibilityEvent } from '../event'
import { MIMES } from './consts'

const defer = typeof setImmediate !== 'undefined' ? setImmediate : (fn: Function) => fn()

export function send (event: H3CompatibilityEvent, data: any, type?: string): Promise<void> {
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

export function defaultContentType (event: H3CompatibilityEvent, type?: string) {
  if (type && !event.res.getHeader('Content-Type')) {
    event.res.setHeader('Content-Type', type)
  }
}

export function sendRedirect (event: H3CompatibilityEvent, location: string, code = 302) {
  event.res.statusCode = code
  event.res.setHeader('Location', location)
  return send(event, 'Redirecting to ' + location, MIMES.html)
}

export function appendHeader (event: H3CompatibilityEvent, name: string, value: string): void {
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
  return typeof data === 'object' && typeof data.pipe === 'function' && typeof data.on === 'function'
}

export function sendStream (event: H3CompatibilityEvent, data: any) {
  return new Promise((resolve, reject) => {
    data.pipe(event.res)
    data.on('end', () => resolve(undefined))
    data.on('error', (error: Error) => reject(createError(error)))
  })
}
