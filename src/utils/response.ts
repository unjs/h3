import type { OutgoingMessage, ServerResponse } from 'http'
import { createError } from '../error'
import type { H3Event } from '../event'
import { MIMES } from './consts'

const defer = typeof setImmediate !== 'undefined' ? setImmediate : (fn: Function) => fn()

export function send (event: H3Event, data?: any, type?: string): Promise<void> {
  if (type) {
    defaultContentType(event, type)
  }
  return new Promise((resolve) => {
    defer(() => {
      event.res.end(data)
      resolve(undefined)
    })
  })
}

export function defaultContentType (event: H3Event, type?: string) {
  if (type && !event.res.getHeader('Content-Type')) {
    event.res.setHeader('Content-Type', type)
  }
}

export function sendRedirect (event: H3Event, location: string, code = 302) {
  event.res.statusCode = code
  event.res.setHeader('Location', location)
  const encodedLoc = location.replace(/"/g, '%22')
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`
  return send(event, html, MIMES.html)
}

export function getResponseHeaders (event: H3Event): ReturnType<H3Event['res']['getHeaders']> {
  return event.res.getHeaders()
}

export function getResponseHeader (event: H3Event, name: string): ReturnType<H3Event['res']['getHeader']> {
  return event.res.getHeader(name)
}

export function setResponseHeaders (event: H3Event, headers: Record<string, Parameters<OutgoingMessage['setHeader']>[1]>): void {
  Object.entries(headers).forEach(([name, value]) => event.res.setHeader(name, value))
}

export const setHeaders = setResponseHeaders

export function setResponseHeader (event: H3Event, name: string, value: Parameters<OutgoingMessage['setHeader']>[1]): void {
  event.res.setHeader(name, value)
}

export const setHeader = setResponseHeader

export function appendResponseHeaders (event: H3Event, headers: Record<string, string>): void {
  Object.entries(headers).forEach(([name, value]) => appendResponseHeader(event, name, value))
}

export const appendHeaders = appendResponseHeaders

export function appendResponseHeader (event: H3Event, name: string, value: string): void {
  let current = event.res.getHeader(name)

  if (!current) {
    event.res.setHeader(name, value)
    return
  }

  if (!Array.isArray(current)) {
    current = [current.toString()]
  }

  event.res.setHeader(name, current.concat(value))
}

export const appendHeader = appendResponseHeader

export function isStream (data: any) {
  return data && typeof data === 'object' && typeof data.pipe === 'function' && typeof data.on === 'function'
}

export function sendStream (event: H3Event, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    data.pipe(event.res)
    data.on('end', () => resolve(undefined))
    data.on('error', (error: Error) => reject(createError(error)))
  })
}

const noop = () => {}
export function writeEarlyHints (event: H3Event, hints: string | string[] | Record<string, string | string[]>, cb: () => void = noop) {
  if (!event.res.socket && !('writeEarlyHints' in event.res)) {
    cb()
    return
  }

  // Normalize if string or string[] is provided
  if (typeof hints === 'string' || Array.isArray(hints)) {
    hints = { link: hints }
  }

  if (hints.link) {
    hints.link = Array.isArray(hints.link) ? hints.link : hints.link.split(',')
    // TODO: remove when https://github.com/nodejs/node/pull/44874 is released
    hints.link = hints.link.map(l => l.trim().replace(/; crossorigin/g, ''))
  }

  if ('writeEarlyHints' in event.res) {
    return event.res.writeEarlyHints(hints, cb)
  }

  const headers: [string, string | string[]][] = Object.entries(hints).map(e => [e[0].toLowerCase(), e[1]])
  if (!headers.length) {
    cb()
    return
  }

  let hint = 'HTTP/1.1 103 Early Hints'
  if (hints.link) {
    hint += `\r\nLink: ${(hints.link as string[]).join('\r\n')}`
  }

  for (const [header, value] of headers) {
    if (header === 'link') { continue }
    hint += `\r\n${header}: ${value}`
  }
  (event.res as ServerResponse).socket!.write(`${hint}\r\n\r\n`, 'utf-8', cb)
}
