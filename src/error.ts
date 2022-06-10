import type { CompatibilityEvent } from './event'
import { MIMES } from './utils'

/**
 * H3 Runtime Error
 * @class
 * @extends Error
 * @property {Number} statusCode An Integer indicating the HTTP response status code.
 * @property {String} statusMessage A String representing the HTTP status message
 * @property {Any} data An extra data that will includes in the response.<br>
 *  This can be used to pass additional information about the error.
 * @property {Boolean} internal Setting this property to <code>true</code> will mark error as an internal error
 */
export class H3Error extends Error {
  statusCode: number = 500
  statusMessage: string = 'H3Error'
  data?: any
}

/**
 * Creates new `Error` that can be used to handle both internal and runtime errors.
 *
 * @param input {Partial<H3Error>}
 * @return {H3Error} An instance of the H3Error
 */
export function createError (input: string | Partial<H3Error>): H3Error {
  if (typeof input === 'string') {
    return new H3Error(input)
  }

  if (input instanceof H3Error) {
    return input
  }

  const err = new H3Error(input.message ?? input.statusMessage, input.cause ? { cause: input.cause } : undefined)

  if (input.statusCode) {
    err.statusCode = input.statusCode
  }

  if (input.statusMessage) {
    err.statusMessage = input.statusMessage
  }

  if (input.data) {
    err.data = input.data
  }

  return err
}

/**
 * Receive an error and return the corresponding response.<br>
 *  H3 internally uses this function to handle unhandled errors.<br>
 *  Note that calling this function will close the connection and no other data will be sent to client afterwards.
 *
 @param event {CompatibilityEvent} H3 event or req passed by h3 handler
 * @param error {H3Error|Error} Raised error
 * @param debug {Boolean} Whether application is in debug mode.<br>
 *  In the debug mode the stack trace of errors will be return in response.
 */
export function sendError (event: CompatibilityEvent, error: Error | H3Error, debug?: boolean) {
  if (event.res.writableEnded) { return }

  const h3Error = isError(error) ? error : createError(error)

  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [] as string[],
    data: h3Error.data
  }

  if (debug) {
    responseBody.stack = (h3Error.stack || '').split('\n').map(l => l.trim())
  }

  if (event.res.writableEnded) { return }
  event.res.statusCode = h3Error.statusCode
  event.res.statusMessage = h3Error.statusMessage
  event.res.setHeader('Content-Type', MIMES.json)
  event.res.end(JSON.stringify(responseBody, null, 2))
}

export function isError (input: any): input is H3Error {
  return input instanceof H3Error
}
