import type { ServerResponse } from 'http'
import { MIMES } from './utils'

export class H2Error extends Error {
  statusCode: number = 500
  statusMessage: string = 'Internal Error'
  data?: any
  internal: boolean = false
}

export function createError (input: Partial<H2Error>): H2Error {
  if (input instanceof H2Error) {
    return input
  }
  const err = new H2Error(input.message)
  if (input.statusCode) {
    err.statusCode = input.statusCode
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage
  }
  if (input.data) {
    err.data = input.data
  }
  if (input.internal) {
    err.internal = input.internal
  }
  return err
}

export function sendError (res: ServerResponse, error: Error | H2Error, debug?: boolean) {
  const h2Error = createError(error)

  // @ts-ignore
  if (h2Error.internal) {
    console.error(h2Error) // eslint-disable-line no-console
  }

  res.statusCode = h2Error.statusCode
  res.statusMessage = h2Error.statusMessage

  const responseBody = {
    statusCode: res.statusCode,
    statusMessage: res.statusMessage,
    stack: [] as string[],
    data: h2Error.data
  }

  if (debug) {
    responseBody.stack = (h2Error.stack || '').split('\n').map(l => l.trim())
  }

  res.setHeader('Content-Type', MIMES.json)
  res.end(JSON.stringify(responseBody, null, 2))
}
