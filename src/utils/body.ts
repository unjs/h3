import type { IncomingMessage } from 'http'
import destr from 'destr'
import type { Encoding } from '../types/node'

const RawBodySymbol = Symbol('h3RawBody')
const ParsedBodySymbol = Symbol('h3RawBody')

/**
 * Reads body of the request and returns encoded raw string (default) or `Buffer` if encoding if falsy.
 * @param req {IncomingMessage} An IncomingMessage object is created by [http.Server](https://nodejs.org/api/http.html#http_class_http_server)
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {String|Buffer} Encoded raw string or raw Buffer of the body
 */
export function useRawBody (req: IncomingMessage, encoding: Encoding = 'utf-8'): Encoding extends false ? Buffer : Promise<string> {
  // @ts-ignore
  if (RawBodySymbol in req) {
    // @ts-ignore
    return Promise.resolve(encoding ? req[RawBodySymbol].toString(encoding) : req[RawBodySymbol])
  }

  // @ts-ignore
  // Workaround for unenv issue https://github.com/unjs/unenv/issues/8
  if ('_body' in req) {
    // @ts-ignore
    return Promise.resolve(req._body)
  }

  return new Promise<string>((resolve, reject) => {
    const bodyData: any[] = []
    req
      .on('error', (err) => { reject(err) })
      .on('data', (chunk) => { bodyData.push(chunk) })
      .on('end', () => {
        // @ts-ignore
        req[RawBodySymbol] = Buffer.concat(bodyData)
        // @ts-ignore
        resolve(encoding ? req[RawBodySymbol].toString(encoding) : req[RawBodySymbol])
      })
  })
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
export async function useBody<T=any> (req: IncomingMessage): Promise<T> {
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
