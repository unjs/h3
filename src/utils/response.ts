import type { ServerResponse } from 'http'
import { createError } from '../error'
import { MIMES } from './consts'

const defer = typeof setImmediate !== 'undefined' ? setImmediate : (fn: Function) => fn()

export function guessMimeType (val: any) {
  const type = typeof val
  if (type === 'string') {
    return MIMES.html
  } else if (type === 'object' || type === 'boolean' || type === 'number' /* IS_JSON */) {
    return MIMES.json
  }
}

export function maybeSendInferredResponse (res: ServerResponse, val: any, options: { jsonSpacing?: number }) {
  if (typeof val === 'undefined') {
    return
  }
  // handle errors
  if (val instanceof Error) {
    throw createError(val)
  }
  /*
   * Stream and Buffer input are sent straight away,
   * implementations will need to provide the Content-Type header themselves.
   */
  if (isStream(val)) {
    return sendStream(res, val)
  }
  if (val && (val as Buffer).buffer) {
    return send(res, val)
  }
  /*
   * Primitive data is sent when a mime type can be determined.
   * The mime type will be the value of the Content-Type header or a guessed mime type based on the type value.
   */
  const mime = (res.getHeader('Content-Type') as string|undefined) || guessMimeType(val)
  if (mime) {
    // ensure we're dealing with a string
    if (typeof val !== 'string') {
      val = mime === MIMES.json ? JSON.stringify(val, null, options?.jsonSpacing) : val.toString()
    }
    return send(res, val, mime)
  }
  /*
   * Mime type could not be determined, nothing will be sent.
   */
}

export function send (res: ServerResponse, data: any, type?: string): Promise<void> {
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
    data.pipe(res)
    data.on('end', () => resolve(undefined))
    data.on('error', (error: Error) => reject(createError(error)))
  })
}
