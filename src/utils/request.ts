import { IncomingMessage } from 'http'
import type { IncomingHttpHeaders } from 'http'
import { getQuery as _getQuery } from 'ufo'
import { createError } from '../error'
import type { HTTPMethod } from '../types'
import type { CompatibilityEvent } from '../event'

export function getQuery (event: CompatibilityEvent) {
  return _getQuery(event.req.url || '')
}

/** @deprecated Use `h3.getQuery` */
export const useQuery = getQuery

export function getMethod (event: CompatibilityEvent, defaultMethod: HTTPMethod = 'GET'): HTTPMethod {
  return (event.req.method || defaultMethod).toUpperCase() as HTTPMethod
}

/** @deprecated Use `h3.getMethod` */
export const useMethod = getMethod

export function isMethod (event: CompatibilityEvent, expected: HTTPMethod | HTTPMethod[], allowHead?: boolean) {
  const method = getMethod(event)

  if (allowHead && method === 'HEAD') {
    return true
  }

  if (typeof expected === 'string') {
    if (method === expected) {
      return true
    }
  } else if (expected.includes(method)) {
    return true
  }

  return false
}

export function assertMethod (event: CompatibilityEvent, expected: HTTPMethod | HTTPMethod[], allowHead?: boolean) {
  if (!isMethod(event, expected, allowHead)) {
    throw createError({
      statusCode: 405,
      statusMessage: 'HTTP method is not allowed.'
    })
  }
}

export function getHeaders (event: CompatibilityEvent): IncomingHttpHeaders {
  return event instanceof IncomingMessage
    ? event.headers
    : event.req.headers
}

export function getHeader (event: CompatibilityEvent, name: string): IncomingHttpHeaders[string] {
  const headers = getHeaders(event)
  const value = headers[name.toLowerCase()]

  return value
}
