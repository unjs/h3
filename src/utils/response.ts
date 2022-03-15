import type { ServerResponse } from 'http'
import { createError } from '../error'
import { MIMES } from './consts'

const defer = typeof setImmediate !== 'undefined' ? setImmediate : (fn: Function) => fn()

export function send (res: ServerResponse, data: any, type?: string) {
  if (type) {
    defaultContentType(res, type)
  }
  return new Promise((resolve) => {
    defer(() => {
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
  return send(res, 'Redirecting to ' + location, MIMES.html)
}

export function appendHeader (res: ServerResponse, name: string, value: string): void {
  let current = res.getHeader(name)

  if (!current) {
    res.setHeader(name, value)
    return
  }

  if (!Array.isArray(current)) {
    current = [current.toString()]
  }

  res.setHeader(name, current.concat(value))
}

export function isStream (data: any) {
  return typeof data === 'object' && typeof data.pipe === 'function' && typeof data.on === 'function'
}

export function sendStream (res: ServerResponse, data: any) {
  return new Promise((resolve, reject) => {
    defer(() => {
      data.pipe(res)
      data.on('end', () => resolve(undefined))
      data.on('error', (error: Error) => reject(createError(error)))
    })
  })
}
