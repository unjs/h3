import type { IncomingMessage, ServerResponse } from 'http'
import { parse, serialize } from 'cookie'
import type { CookieSerializeOptions } from '../types/cookie'
import { appendHeader } from './response'

export function useCookies (req: IncomingMessage): Record<string, string> {
  return parse(req.headers.cookie || '')
}

export function useCookie (req: IncomingMessage, name: string): string | undefined {
  return useCookies(req)[name]
}

export function setCookie (res: ServerResponse, name: string, value: string, serializeOptions: CookieSerializeOptions) {
  const cookieStr = serialize(name, value, serializeOptions)
  appendHeader(res, 'Set-Cookie', cookieStr)
}
