import type { ServerResponse, IncomingMessage } from 'http'
import { URL, URLSearchParams } from 'url'
import { PHandle, RuntimeError } from './types'

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
  const body = error.body || `"${res.statusMessage} (${res.statusCode})"`
  if (typeof body === 'object') {
    res.setHeader('Content-Type', 'application/json')
  }
  res.end(body)
}

export function createError (runtimeError: RuntimeError) {
  const err = new Error(runtimeError.statusMessage)
  // @ts-ignore
  err.statusCode = runtimeError.statusCode
  // @ts-ignore
  err.statusMessage = runtimeError.statusMessage
  // @ts-ignore
  err.body = runtimeError.body
  // @ts-ignore
  err.runtime = runtimeError.runtime || false
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

export function useQuery (req: IncomingMessage): URLSearchParams {
  const url = new URL(req.url || '', undefined)
  return url.searchParams
}

export function useBody<T> (request: IncomingMessage): Promise<T | string> {
  return new Promise<T | string>((resolve, reject) => {
    const body: any[] = []
    request.on('error', (err) => {
      reject(err)
    }).on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      const bodyString = Buffer.concat(body).toString()
      if (request.headers['content-type'] === 'application/json') {
        const jsonObject = JSON.parse(bodyString)
        return resolve(jsonObject)
      }
      resolve(bodyString)
    })
  })
}
