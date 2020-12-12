import type { IncomingMessage } from 'http'

import destr from 'destr'

type Encoding = false | 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex'

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
