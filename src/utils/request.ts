import type { IncomingMessage } from 'http'
import { getQuery } from 'ufo'
import { createError } from '../error'

export function useQuery (req: IncomingMessage) {
  return getQuery(req.url || '')
}

// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
export type HTTPMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE'

export function useMethod (req: IncomingMessage, defaultMethod: HTTPMethod = 'GET'): HTTPMethod {
  return (req.method || defaultMethod).toUpperCase() as HTTPMethod
}

export function isMethod (req: IncomingMessage, expected: HTTPMethod | HTTPMethod[], allowHead?: boolean) {
  const method = useMethod(req)

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

export function assertMethod (req: IncomingMessage, expected: HTTPMethod | HTTPMethod[], allowHead?: boolean) {
  if (!isMethod(req, expected, allowHead)) {
    throw createError({
      statusCode: 405,
      statusMessage: 'HTTP method is not allowed.'
    })
  }
}
