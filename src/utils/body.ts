import destr from 'destr'
import type { Encoding, HTTPMethod, CompatibilityEvent } from '../types'
import { assertMethod } from './request'

const RawBodySymbol = Symbol('h3RawBody')
const ParsedBodySymbol = Symbol('h3RawBody')

const PayloadMethods: HTTPMethod[] = ['PATCH', 'POST', 'PUT', 'DELETE']

/**
 * Reads body of the request and returns encoded raw string (default) or `Buffer` if encoding if falsy.
 * @param event {CompatibilityEvent} H3 event or req passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {String|Buffer} Encoded raw string or raw Buffer of the body
 */
export function readRawBody (event: CompatibilityEvent, encoding: Encoding = 'utf-8'): Encoding extends false ? Buffer : Promise<string | Buffer> {
  // Ensure using correct HTTP method before attempt to read payload
  assertMethod(event, PayloadMethods)

  if (RawBodySymbol in event.req) {
    const promise = Promise.resolve((event.req as any)[RawBodySymbol])
    return encoding ? promise.then(buff => buff.toString(encoding)) : promise
  }

  // Workaround for unenv issue https://github.com/unjs/unenv/issues/8
  if ('body' in event.req) {
    return Promise.resolve((event.req as any).body)
  }

  const promise = (event.req as any)[RawBodySymbol] = new Promise<Buffer>((resolve, reject) => {
    const bodyData: any[] = []
    event.req
      .on('error', (err) => { reject(err) })
      .on('data', (chunk) => { bodyData.push(chunk) })
      .on('end', () => { resolve(Buffer.concat(bodyData)) })
  })

  return encoding ? promise.then(buff => buff.toString(encoding)) : promise
}

/** @deprecated Use `h3.readRawBody` */
export const useRawBody = readRawBody

/**
 * Reads request body and try to safely parse using [destr](https://github.com/unjs/destr)
 * @param event {CompatibilityEvent} H3 event or req passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body
 *
 * ```ts
 * const body = await useBody(req)
 * ```
 */
export async function readBody<T=any> (event: CompatibilityEvent): Promise<T> {
  if (ParsedBodySymbol in event.req) {
    return (event.req as any)[ParsedBodySymbol]
  }

  // TODO: Handle buffer
  const body = await readRawBody(event) as string

  if (event.req.headers['content-type'] === 'application/x-www-form-urlencoded') {
    const parsedForm = Object.fromEntries(new URLSearchParams(body))
    return parsedForm as unknown as T
  }

  const json = destr(body) as T
  (event.req as any)[ParsedBodySymbol] = json
  return json
}

/** @deprecated Use `h3.readBody` */
export const useBody = readBody
