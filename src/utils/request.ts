import { getQuery as _getQuery } from 'ufo'
import { createError } from '../error'
import type { HTTPMethod } from '../types'
import type { H3Event } from '../event'

export function getQuery (event: H3Event) {
  return _getQuery(event.req.url || '')
}

/** @deprecated Use `h3.getQuery` */
export const useQuery = getQuery

export function getRouterParams (event: H3Event): H3Event['context'] {
  // Fallback object needs to be returned in case router is not used (#149)
  return event.context.params || {}
}

export function getRouterParam (event: H3Event, name: string): H3Event['context'][string] {
  const params = getRouterParams(event)

  return params[name]
}

export function getMethod (event: H3Event, defaultMethod: HTTPMethod = 'GET'): HTTPMethod {
  return (event.req.method || defaultMethod).toUpperCase() as HTTPMethod
}

/** @deprecated Use `h3.getMethod` */
export const useMethod = getMethod

export function isMethod (event: H3Event, expected: HTTPMethod | HTTPMethod[], allowHead?: boolean) {
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

export function assertMethod (event: H3Event, expected: HTTPMethod | HTTPMethod[], allowHead?: boolean) {
  if (!isMethod(event, expected, allowHead)) {
    throw createError({
      statusCode: 405,
      statusMessage: 'HTTP method is not allowed.'
    })
  }
}

export function getRequestHeaders (event: H3Event): H3Event['req']['headers'] {
  return event.req.headers
}

export const getHeaders = getRequestHeaders

export function getRequestHeader (event: H3Event, name: string): H3Event['req']['headers'][string] {
  const headers = getRequestHeaders(event)
  const value = headers[name.toLowerCase()]

  return value
}

export const getHeader = getRequestHeader
