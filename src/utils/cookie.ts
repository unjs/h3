import type { IncomingMessage, ServerResponse } from 'http'
import { parse, serialize } from 'cookie'
import type { CookieSerializeOptions } from '../types/cookie'
import { appendHeader } from './response'

/**
 * Parse the request to get HTTP Cookie header string and returning an object of all cookie name-value pairs.
 * @param req {IncomingMessage} An IncomingMessage object created by [http.Server](https://nodejs.org/api/http.html#http_class_http_server)
 * @returns Object of cookie name-value pairs
 * ```ts
 * const cookies = useCookies(req)
 * ```
 */
export function useCookies (req: IncomingMessage): Record<string, string> {
  return parse(req.headers.cookie || '')
}

/**
 * Get a cookie value by name.
 * @param req {IncomingMessage} An IncomingMessage object created by [http.Server](https://nodejs.org/api/http.html#http_class_http_server)
 * @param name Name of the cookie to get
 * @returns {*} Value of the cookie (String or undefined)
 * ```ts
 * const authorization = useCookie(request, 'Authorization')
 * ```
 */
export function useCookie (req: IncomingMessage, name: string): string | undefined {
  return useCookies(req)[name]
}

/**
 * Set a cookie value by name.
 * @param res {ServerResponse} A ServerResponse object created by [http.Server](https://nodejs.org/api/http.html#http_class_http_server)
 * @param name Name of the cookie to set
 * @param value Value of the cookie to set
 * @param serializeOptions {CookieSerializeOptions} Options for serializing the cookie
 * ```ts
 * setCookie(res, 'Authorization', '1234567')
 * ```
 */
export function setCookie (res: ServerResponse, name: string, value: string, serializeOptions?: CookieSerializeOptions) {
  const cookieStr = serialize(name, value, serializeOptions)
  appendHeader(res, 'Set-Cookie', cookieStr)
}

/**
 * Set a cookie value by name.
 * @param res {ServerResponse} A ServerResponse object created by [http.Server](https://nodejs.org/api/http.html#http_class_http_server)
 * @param name Name of the cookie to delete
 * @param serializeOptions {CookieSerializeOptions} Cookie options
 * ```ts
 * deleteCookie(res, 'Authorization')
 * ```
 */
export function deleteCookie (res: ServerResponse, name: string, serializeOptions?: CookieSerializeOptions) {
  setCookie(res, name, '', {
    ...serializeOptions,
    maxAge: 0
  })
}
