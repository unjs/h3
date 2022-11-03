import type { H3Event } from '../event'
import { getMethod, getRequestHeaders } from './request'
import { readRawBody } from './body'
import type { RequestHeaders } from 'src/types'

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
  // TODO: Allow overriding headers
  const headers = Object.create(null)
  const reqHeaders = getRequestHeaders(event)
  for (const name in reqHeaders) {
    headers[name] = reqHeaders[name]
  }

  const fetchOptions: RequestInit = {
    headers,
    method,
    body,
    ...opts.fetchOptions
  }

  return sendProxy(event, target, {
    ...opts,
    fetchOptions
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
