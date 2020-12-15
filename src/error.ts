import type { ServerResponse } from 'http'
import { MIMES } from './utils'

/**
 * Custom error class for H2.
 * @class
 * @extends Error
 * @property {Number} statusCode An Integer indicating the HTTP response status code.
 * @property {String} statusMessage A String representing the HTTP status message
 * @property {Any} data An extra data that will includes in the response.<br>
 *  This can be used to pass additional information about the error.
 * @property {Boolean} internal Setting this property to <code>true</code> will mark error as an internal error
 */
export class H2Error extends Error {
  statusCode: number = 500
  statusMessage: string = 'Internal Error'
  data?: any
  internal: boolean = false
}

/**
 * Creates new `Error` that can be used to handle both internal and runtime errors.
 *
 * @param input {Partial<H2Error>}
 * @return {H2Error} An instance of the H2Error
 */
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

/**
 * Recieve an error and return the corresponding response.<br>
 *  H2 internally uses this fucntion to handle unhandled errors.<br>
 *  Note that calling this function will close the connection and no other data will be sent to client afterwards.
 *
 * @param res {ServerResponse} The ServerResponse object is passed as the second parameter in the handler function
 * @param error {H2Error|Error} Raised error
 * @param debug {Boolean} Whether application is in debug mode.<br>
 *  In the debug mode the stack trace of errors will be return in response.
 */
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
