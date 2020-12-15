import type { IncomingMessage, ServerResponse } from 'http'

export interface CookieOptions {
  expires: Date
  maxAge: number
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: 'Strict' | 'Lax' | 'None'
}

export function isValidCookieName (key: string): boolean {
  return !key.match(/\(\)<>@,;:"\/\[\]\?=\{\}/)
}

export function useCookie (req: IncomingMessage): Record<string, string> {
  // @ts-ignore
  if (req.cookie) {
    // @ts-ignore
    return req.cookie
  }

  const { cookie } = req.headers
  const cookieEntries = (cookie || '')
    .split(';')
    .map((item) => {
      const [key, value] = item.trim().split('=')
      return [key, decodeURI(value)]
    })

  const cookieObject = Object.fromEntries(cookieEntries)

  // @ts-ignore
  req.cookie = cookieObject

  return cookieObject
}

export function useCookieWriter (res: ServerResponse) {
  return (name: string, value: string, options: Partial<CookieOptions> = {}) => {
    if (!isValidCookieName(name)) {
      throw new Error('Invalid cookie name')
    }
    if (name.startsWith('__Secure-') || name.startsWith('__Host-')) {
      options.secure = true
    }

    const values = [
      `${name}=${encodeURI(value)}`
    ]

    Object.entries(options).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value === true) { values.push(key) }
        return
      }
      if (value instanceof Date) {
        values.push(`${key}=${(value as Date).toUTCString()}`)
      } else {
        values.push(`${key}=${String(value)}`)
      }
    })
    res.setHeader('Set-Cookie', values.join(';'))
  }
}
