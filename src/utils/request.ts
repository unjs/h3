import { getQuery } from 'ufo'
import { createError } from '../error'
import type { HTTPMethod } from '../types/http'
import type { H3CompatibilityEvent } from '../event'

export function useQuery (event: H3CompatibilityEvent) {
  return getQuery(event.req.url || '')
}

export function useMethod (event: H3CompatibilityEvent, defaultMethod: HTTPMethod = 'GET'): HTTPMethod {
  return (event.req.method || defaultMethod).toUpperCase() as HTTPMethod
}

export function isMethod (event: H3CompatibilityEvent, expected: HTTPMethod | HTTPMethod[], allowHead?: boolean) {
  const method = useMethod(event)

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

export function assertMethod (event: H3CompatibilityEvent, expected: HTTPMethod | HTTPMethod[], allowHead?: boolean) {
  if (!isMethod(event, expected, allowHead)) {
    throw createError({
      statusCode: 405,
      statusMessage: 'HTTP method is not allowed.'
    })
  }
}
