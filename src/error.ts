import type { H3Event } from "./event";
import {
  MIMES,
  setResponseStatus,
  sanetizeStatusMessage,
  sanetizeStatusCode,
} from "./utils";
/**
 * H3 Runtime Error
 * @class
 * @extends Error
 * @property {Number} statusCode An Integer indicating the HTTP response status code.
 * @property {String} statusMessage A String representing the HTTP status message
 * @property {String} fatal Indicates if the error is a fatal error.
 * @property {String} unhandled Indicates if the error was unhandled and auto captured.
 * @property {Any} data An extra data that will includes in the response.<br>
 *  This can be used to pass additional information about the error.
 * @property {Boolean} internal Setting this property to <code>true</code> will mark error as an internal error
 */
export class H3Error extends Error {
  static __h3_error__ = true;
  toJSON() {
    const obj: Pick<
      H3Error,
      "message" | "statusCode" | "statusMessage" | "data"
    > = {
      message: sanetizeStatusMessage(this.message),
      statusCode: sanetizeStatusCode(this.statusCode, 500),
    };

    if (this.statusMessage) {
      obj.statusMessage = sanetizeStatusMessage(this.statusMessage);
    }
    if (this.data !== undefined) {
      obj.data = this.data;
    }

    return obj;
  }

  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage?: string = undefined;
  data?: any;
}

/**
 * Creates new `Error` that can be used to handle both internal and runtime errors.
 *
 * @param input {Partial<H3Error>}
 * @return {H3Error} An instance of the H3Error
 */
export function createError(
  input: string | (Partial<H3Error> & { status?: number; statusText?: string })
): H3Error {
  if (typeof input === "string") {
    return new H3Error(input);
  }

  if (isError(input)) {
    return input;
  }

  const err = new H3Error(
    input.message ?? input.statusMessage,
    // @ts-ignore
    input.cause ? { cause: input.cause } : undefined
  );

  if ("stack" in input) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        },
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {}
    }
  }

  if (input.data) {
    err.data = input.data;
  }

  if (input.statusCode) {
    err.statusCode = sanetizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanetizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = sanetizeStatusMessage(input.statusMessage);
  } else if (input.statusText) {
    err.statusMessage = sanetizeStatusMessage(input.statusText);
  }

  if (input.fatal !== undefined) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== undefined) {
    err.unhandled = input.unhandled;
  }

  return err;
}

/**
 * Receive an error and return the corresponding response.<br>
 *  H3 internally uses this function to handle unhandled errors.<br>
 *  Note that calling this function will close the connection and no other data will be sent to client afterwards.
 *
 @param event {H3Event} H3 event or req passed by h3 handler
 * @param error {H3Error|Error} Raised error
 * @param debug {Boolean} Whether application is in debug mode.<br>
 *  In the debug mode the stack trace of errors will be return in response.
 */
export function sendError(
  event: H3Event,
  error: Error | H3Error,
  debug?: boolean
) {
  if (event.node.res.writableEnded) {
    return;
  }

  const h3Error = isError(error) ? error : createError(error);

  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [] as string[],
    data: h3Error.data,
  };

  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }

  if (event.node.res.writableEnded) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode as unknown as string);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, undefined, 2));
}

export function isError(input: any): input is H3Error {
  return input?.constructor?.__h3_error__ === true;
}
