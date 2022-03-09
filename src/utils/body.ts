import type { IncomingMessage } from 'http'
import destr from 'destr'
import type { Encoding } from '../types/node'
import type { HTTPMethod } from '../types/http'
import { assertMethod } from './request'

const RawBodySymbol = Symbol('h3RawBody')
const ParsedBodySymbol = Symbol('h3RawBody')

const PayloadMethods = ['PATCH', 'POST', 'PUT', 'DELETE'] as HTTPMethod[]

interface _IncomingMessage extends IncomingMessage {
  [RawBodySymbol]?: Promise<Buffer>
  ParsedBodySymbol?: any
  body?: any // unenv
}

/**
 * Reads body of the request and returns encoded raw string (default) or `Buffer` if encoding if falsy.
 * @param req {IncomingMessage} An IncomingMessage object is created by [http.Server](https://nodejs.org/api/http.html#http_class_http_server)
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {String|Buffer} Encoded raw string or raw Buffer of the body
 */
export function useRawBody (req: _IncomingMessage, encoding: Encoding = 'utf-8'): Encoding extends false ? Buffer : Promise<string> {
  // Ensure using correct HTTP method before attempt to read payload
  assertMethod(req, PayloadMethods)

  if (RawBodySymbol in req) {
    const promise = Promise.resolve(req[RawBodySymbol])
    // @ts-ignore
    return encoding ? promise.then(buff => buff.toString(encoding)) : promise
  }

  // Workaround for unenv issue https://github.com/unjs/unenv/issues/8
  if ('body' in req) {
    return Promise.resolve(req.body)
  }

  const promise = req[RawBodySymbol] = new Promise<Buffer>((resolve, reject) => {
    const bodyData: any[] = []
    req
      .on('error', (err) => { reject(err) })
      .on('data', (chunk) => { bodyData.push(chunk) })
      .on('end', () => { resolve(Buffer.concat(bodyData)) })
  })

  // @ts-ignore
  return encoding ? promise.then(buff => buff.toString(encoding)) : promise
}

/**
 * Reads request body and try to safely parse using [destr](https://github.com/unjs/destr)
 * @param req {IncomingMessage} An IncomingMessage object created by [http.Server](https://nodejs.org/api/http.html#http_class_http_server)
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body
 *
 * ```ts
 * const body = await useBody(req)
 * ```
 */
export async function useBody<T=any> (req: _IncomingMessage): Promise<T> {
  // @ts-ignore
  if (ParsedBodySymbol in req) {
    // @ts-ignore
    return req[ParsedBodySymbol]
  }

  const body = await useRawBody(req)
  const json = destr(body)

  // @ts-ignore
  req[ParsedBodySymbol] = json

  return json
}
