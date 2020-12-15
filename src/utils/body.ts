import type { IncomingMessage } from 'http'
import destr from 'destr'
import type { Encoding } from '../types/node'

/**
 * Reads body of the request and returns encoded raw string (default) or `Buffer` if encoding if falsy.
 * @param req {IncomingMessage} An IncomingMessage object is created by
 *  <a href="https://nodejs.org/api/http.html#http_class_http_server">http.Server</a>
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {String|Buffer} Encoded raw string or raw Buffer of the body
 */
export function useBody (req: IncomingMessage, encoding: Encoding = 'utf-8'): Encoding extends false ? Buffer : Promise<string> {
  // @ts-ignore
  if (req.rawBody) {
    // @ts-ignore
    return Promise.resolve(encoding ? req.rawBody.toString(encoding) : req.rawBody)
  }

  return new Promise<string>((resolve, reject) => {
    const bodyData: any[] = []
    req
      .on('error', (err) => { reject(err) })
      .on('data', (chunk) => { bodyData.push(chunk) })
      .on('end', () => {
        // @ts-ignore
        req.rawBody = Buffer.concat(bodyData)
        // @ts-ignore
        resolve(encoding ? req.rawBody.toString(encoding) : req.rawBody)
      })
  })
}

/**
 * Reads body of the request and returns encoded raw string or `Buffer`.
 * This utility uses {@link https://github.com/nuxt-contrib/destr destr} to parse the body
 *
 * @param req {IncomingMessage} An IncomingMessage object is created by
 *  <a href="https://nodejs.org/api/http.html#http_class_http_server">http.Server</a>
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {*} The Object, Array, string, number, boolean, or null value corresponding to the request JSON body
 */
export async function useBodyJSON<T> (req: IncomingMessage): Promise<T> {
  // @ts-ignore
  if (req.jsonBody) {
    // @ts-ignore
    return req.jsonBody
  }

  const body = await useBody(req)
  const json = destr(body)

  // @ts-ignore
  req.jsonBody = json

  return json
}
