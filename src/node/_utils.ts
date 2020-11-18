import type { HeadersObject } from '../types'

export function rawHeaders (headers: HeadersObject) {
  const rawHeaders = []
  for (const key in headers) {
    if (Array.isArray(headers[key])) {
      for (const h of headers[key] as any) {
        rawHeaders.push(key, h)
      }
    } else {
      rawHeaders.push(key, headers[key])
    }
  }
  return rawHeaders
}

export function mergeFns (...functions: Function[]) {
  return function (...args: any[]) {
    for (const fn of functions) {
      fn(...args)
    }
  }
}
