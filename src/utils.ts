import type { ServerResponse, IncomingMessage } from 'http'
import { URL, URLSearchParams } from 'url'
import destr from 'destr'
import { InternalError, PHandle, RuntimeError } from './types'

export const MIMES = {
  html: 'text/html',
  json: 'application/json'
}

export function send (res: ServerResponse, data: any, type?: string) {
  if (type) {
    defaultContentType(res, type)
  }
  res.end(data)
}

export function defaultContentType (res: ServerResponse, type?: string) {
  if (type && !res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', type)
  }
}

export function sendError (res: ServerResponse, error: Error | string, code?: number, debug: boolean = true) {
  res.statusCode = code ||
    (res.statusCode !== 200 && res.statusCode) ||
    // @ts-ignore
    error.statusCode || error.status ||
    500

  // @ts-ignore
  if (debug && !error.runtime && res.statusCode !== 404) {
    console.error(error) // eslint-disable-line no-console
  }

  // @ts-ignore
  res.statusMessage = res.statusMessage || error.statusMessage || error.statusText || 'Internal Error'

  // @ts-ignore
  let body: any = {
    statusCode: res.statusCode,
    statusMessage: res.statusMessage
  }
  // @ts-ignore
  if (debug || error.runtime) {
    // @ts-ignore
    body = error.body || body
  }
  if (typeof body === 'object') {
    res.setHeader('Content-Type', MIMES.json)
    body = JSON.stringify(body)
  }
  res.end(body)
}

export function createError (runtimeError: InternalError | RuntimeError) {
  const err = new Error(runtimeError.statusMessage)
  // @ts-ignore
  err.statusCode = runtimeError.statusCode
  // @ts-ignore
  err.statusMessage = runtimeError.statusMessage
  // @ts-ignore
  err.body = runtimeError.body
  // @ts-ignore
  err.runtime = runtimeError.runtime || false
  // @ts-ignore
  err.internal = runtimeError.internal || false
  return err
}

export function sendRedirect (res: ServerResponse, location: string, code = 302) {
  res.statusCode = code
  res.setHeader('Location', location)
  defaultContentType(res, MIMES.html)
  res.end(location)
}

export function stripTrailingSlash (str: string = '') {
  return str.endsWith('/') ? str.slice(0, -1) : str
}

export function useBase (base: string, handle: PHandle): PHandle {
  base = stripTrailingSlash(base)
  if (!base) { return handle }
  return function (req, res) {
    (req as any).originalUrl = (req as any).originalUrl || req.url || '/'
    req.url = req.url || ''
    if (req.url.startsWith(base)) {
      req.url = req.url.substr(base.length) || '/'
    }
    return handle(req, res)
  }
}

export function getParams (req: IncomingMessage): URLSearchParams {
  const url = new URL(req.url || '', 'http://localhost')
  return url.searchParams
}

export function getQuery (req: IncomingMessage) {
  const params = getParams(req)
  const query: { [key: string]: string | string[] } = {}
  for (const [name, value] of params) {
    if (typeof query[name] === 'undefined') {
      query[name] = value
    } else if (typeof query[name] === 'string') {
      query[name] = [query[name] as string]
    }
    if (Array.isArray(query[name])) {
      (query[name] as string[]).push(value)
    }
  }
  return query
}

export function getBody (req: IncomingMessage): Promise<string> {
  // @ts-ignore
  if (req.body) { return req.body }
  return new Promise<string>((resolve, reject) => {
    const bodyData: any[] = []
    req.on('error', (err) => {
      reject(err)
    }).on('data', (chunk) => {
      bodyData.push(chunk)
    }).on('end', () => {
      const body = Buffer.concat(bodyData).toString()
      // @ts-ignore
      req.body = body
      resolve(body)
    })
  })
}

export async function getJSON<T> (req: IncomingMessage): Promise<T> {
  // @ts-ignore
  if (req.bodyJSON) { return req.bodyJSON }

  const body = await getBody(req)
  const json = destr(body)
  // @ts-ignore
  req.bodyJSON = json
  return json
}
