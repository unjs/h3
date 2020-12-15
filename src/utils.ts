import type { ServerResponse, IncomingMessage } from 'http'

import { withoutTrailingSlash, getParams } from '@nuxt/ufo'
import { PHandle } from './types'

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

/**
 * Redirect to another location
 *
 * @param res {ServerResponse} The ServerResponse object is passed as the second parameter in the handler function
 * @param location {String} Destination location
 * @param code {Number} [code=302] - HTTP status code for URL redirection. <br/>
 * This value can be 302 for temporary redirects or 301 for permanent redirect.
 */
export function sendRedirect (res: ServerResponse, location: string, code = 302) {
  res.statusCode = code
  res.setHeader('Location', location)
  defaultContentType(res, MIMES.html)
  res.end(location)
}

export function useBase (base: string, handle: PHandle): PHandle {
  base = withoutTrailingSlash(base)
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

/**
 * An object containing all keys and values of the query parameters
 * @typedef { Object } SearchParams
 *
 */

/**
 * Parse query parametes of the request and returns equivalent object.
 * When a single key repeats more than once in the query,
 * the value of that key in the result object will be an array.
 *
 * @param req {IncomingMessage} An IncomingMessage object is created by
 *  {@link https://nodejs.org/api/http.html#http_class_http_server http.Server}
 *
 * @return {SearchParams} An object containing all keys and values of the query parameters
 */
export function useQuery (req: IncomingMessage) {
  return getParams(req.url || '')
}
