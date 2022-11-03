import type { H3Event } from '../event'
import type { RequestHeaders } from '../types'
import { getMethod, getRequestHeaders } from './request'
import { readRawBody } from './body'

export interface ProxyOptions {
  headers?: RequestHeaders | HeadersInit
  fetchOptions?: RequestInit
  fetch?: typeof fetch
  sendStream?: boolean
}

const PayloadMethods = ['PATCH', 'POST', 'PUT', 'DELETE']

export async function proxyRequest (event: H3Event, target: string, opts: ProxyOptions = {}) {
  // Method
  const method = getMethod(event)

  // Body
  let body
  if (PayloadMethods.includes(method)) {
    body = await readRawBody(event).catch(() => undefined)
  }

  // Headers
  const headers = Object.create(null)
  const reqHeaders = getRequestHeaders(event)
  for (const name in reqHeaders) {
    headers[name] = reqHeaders[name]
  }
  if (opts.fetchOptions?.headers) {
    Object.assign(headers, opts.fetchOptions!.headers)
  }
  if (opts.headers) {
    Object.assign(headers, opts.headers)
  }

  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      headers,
      method,
      body,
      ...opts.fetchOptions
    }
  })
}

export async function sendProxy (event: H3Event, target: string, opts: ProxyOptions = {}) {
  const _fetch = opts.fetch || globalThis.fetch
  if (!_fetch) {
    throw new Error('fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js.')
  }

  const response = await _fetch(target, {
    headers: opts.headers as HeadersInit,
    ...opts.fetchOptions
  })
  event.res.statusCode = response.status
  event.res.statusMessage = response.statusText

  for (const [key, value] of response.headers.entries()) {
    if (key === 'content-encoding') { continue }
    if (key === 'content-length') { continue }
    event.res.setHeader(key, value)
  }

  try {
    if (response.body) {
      if (opts.sendStream === false) {
        const data = new Uint8Array(await response.arrayBuffer())
        event.res.end(data)
      } else {
        for await (const chunk of response.body as any as AsyncIterable<Uint8Array>) {
          event.res.write(chunk)
        }
        event.res.end()
      }
    }
  } catch (err) {
    event.res.end()
    throw err
  }
}
