import type { IncomingMessage } from 'http'
import destr from 'destr'
import type { Encoding, HTTPMethod } from '../types'
import type { H3Event } from '../event'
import { assertMethod } from './request'

const RawBodySymbol = Symbol.for('h3RawBody')
const ParsedBodySymbol = Symbol.for('h3ParsedBody')
type InternalRequest<T=any> = IncomingMessage & {
    [RawBodySymbol]?: Promise<Buffer | undefined>
    [ParsedBodySymbol]?: T
    body?: string | undefined
}

const PayloadMethods: HTTPMethod[] = ['PATCH', 'POST', 'PUT', 'DELETE']

/**
 * Reads body of the request and returns encoded raw string (default), or `Buffer` if encoding is false.
 * @param event {H3Event} H3 event or req passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {String|Buffer} Encoded raw string or raw Buffer of the body
 */
export function readRawBody (event: H3Event, encoding: false): Promise<Buffer | undefined>
// eslint-disable-next-line no-redeclare
export function readRawBody (event: H3Event, encoding?: Exclude<Encoding, false>): Promise<string | undefined>
// eslint-disable-next-line no-redeclare
export function readRawBody (event: H3Event, encoding: Encoding = 'utf-8'): Promise<Buffer | string | undefined> {
  // Ensure using correct HTTP method before attempt to read payload
  assertMethod(event, PayloadMethods)

  const request = event.req as InternalRequest

  // Workaround for unenv issue https://github.com/unjs/unenv/issues/8
  if ('body' in request) {
    return Promise.resolve(request.body)
  }

  let body = request[RawBodySymbol]
  if (!body) {
    if (!parseInt(request.headers['content-length'] || '')) {
      return Promise.resolve(undefined)
    }

    body = request[RawBodySymbol] = new Promise<Buffer | undefined>((resolve, reject) => {
      const bodyData: any[] = []
      request
        .on('error', (err) => { reject(err) })
        .on('data', (chunk) => { bodyData.push(chunk) })
        .on('end', () => { resolve(Buffer.concat(bodyData)) })
    })
  }

  return encoding ? body.then(buff => buff?.toString(encoding)) : body
}

/** @deprecated Use `h3.readRawBody` */
export const useRawBody = readRawBody

/**
 * Reads request body and tries to safely parse using [destr](https://github.com/unjs/destr).
 * @param event {H3Event} H3 event passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body
 *
 * ```ts
 * const body = await readBody(event)
 * ```
 */
export async function readBody<T=any> (event: H3Event): Promise<T | undefined | string> {
  const request = event.req as InternalRequest<T>
  if (ParsedBodySymbol in request) {
    return request[ParsedBodySymbol]
  }

  const body = await readRawBody(event)
  const contentType = request.headers['content-type']
  if (contentType === 'application/x-www-form-urlencoded') {
    const parsedForm = Object.fromEntries(new URLSearchParams(body))
    return parsedForm as unknown as T
  } else if (contentType === 'application/json' || contentType === undefined) {
    const json = destr(body, { strict: true }) as T
    request[ParsedBodySymbol] = json
    return json
  } else if (contentType === 'text/plain') {
    return body
  } else {
    throw new Error(`Unsupported content-type: ${contentType}`)
  }
}

/** @deprecated Use `h3.readBody` */
export const useBody = readBody
