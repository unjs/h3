import type { IncomingMessage } from 'http'
import destr from 'destr'
import type { Encoding } from '../types/node'

const RawBodySymbol = Symbol('h2RawBody')
const ParsedBodySymbol = Symbol('h2RawBody')

/**
 * Reads body of the request and returns encoded raw string (default) or `Buffer` if encoding if falsy.
 * @param req {IncomingMessage} An IncomingMessage object is created by
 *  <a href="https://nodejs.org/api/http.html#http_class_http_server">http.Server</a>
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {String|Buffer} Encoded raw string or raw Buffer of the body
 */
export function useRawBody (req: IncomingMessage, encoding: Encoding = 'utf-8'): Encoding extends false ? Buffer : Promise<string> {
  // @ts-ignore
  if (req[RawBodySymbol]) {
    // @ts-ignore
    return Promise.resolve(encoding ? req[RawBodySymbol].toString(encoding) : req[RawBodySymbol])
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
 * Reads request body and try to safely parse using {@link https://github.com/nuxt-contrib/destr destr}
 * @param req {IncomingMessage} An IncomingMessage object is created by
 *  <a href="https://nodejs.org/api/http.html#http_class_http_server">http.Server</a>
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {*} The Object, Array, string, number, boolean, or null value corresponding to the request JSON body
 */
export async function useBody<T=any> (req: IncomingMessage): Promise<T> {
  // @ts-ignore
  if (req[ParsedBodySymbol]) {
    // @ts-ignore
    return req[ParsedBodySymbol]
  }

  const body = await useBody(req)
  const json = destr(body)

  // @ts-ignore
  req[ParsedBodySymbol] = json

  return json
}
