import type { H3Event } from "./event";
import {
  MIMES,
  setResponseStatus,
  sanitizeStatusMessage,
  sanitizeStatusCode,
} from "./utils";
import { hasProp } from "./utils/internal/object";

/**
 * H3 Runtime Error
 * @class
 * @extends Error
 * @property {number} statusCode - An integer indicating the HTTP response status code.
 * @property {string} statusMessage - A string representing the HTTP status message.
 * @property {boolean} fatal - Indicates if the error is a fatal error.
 * @property {boolean} unhandled - Indicates if the error was unhandled and auto captured.
 * @property {DataT} data - An extra data that will be included in the response.
 *                         This can be used to pass additional information about the error.
 * @property {boolean} internal - Setting this property to `true` will mark the error as an internal error.
 */
export class H3Error<DataT = unknown> extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage?: string;
  data?: DataT;
  cause?: unknown;

  constructor(message: string, opts: { cause?: unknown } = {}) {
    // @ts-ignore https://v8.dev/features/error-cause
    super(message, opts);

    // Polyfill cause for other runtimes
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }

  toJSON() {
    const obj: Pick<
      H3Error<DataT>,
      "message" | "statusCode" | "statusMessage" | "data"
    > = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500),
    };

    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== undefined) {
      obj.data = this.data;
    }

    return obj;
  }
}

/**
 * Creates a new `Error` that can be used to handle both internal and runtime errors.
 *
 * @param input {string | (Partial<H3Error> & { status?: number; statusText?: string })} - The error message or an object containing error properties.
 * @return {H3Error} - An instance of H3Error.
 */
export function createError<DataT = unknown>(
  input:
    | string
    | (Partial<H3Error<DataT>> & { status?: number; statusText?: string }),
) {
  if (typeof input === "string") {
    return new H3Error<DataT>(input);
  }

  if (isError<DataT>(input)) {
    return input;
  }

  const err = new H3Error<DataT>(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input,
  });

  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        },
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
        // Ignore
      }
    }
  }

  if (input.data) {
    err.data = input.data;
  }

  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText as string;
  }
  if (err.statusMessage) {
    // TODO: Always sanitize the status message in the next major releases
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default.",
      );
    }
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
 * Receives an error and returns the corresponding response.
 * H3 internally uses this function to handle unhandled errors.
 * Note that calling this function will close the connection and no other data will be sent to the client afterwards.
 *
 * @param event {H3Event} - H3 event or req passed by h3 handler.
 * @param error {Error | H3Error} - The raised error.
 * @param debug {boolean} - Whether the application is in debug mode.
 * In the debug mode, the stack trace of errors will be returned in the response.
 */
export function sendError(
  event: H3Event,
  error: Error | H3Error,
  debug?: boolean,
) {
  if (event.handled) {
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

  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode as unknown as string);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, undefined, 2));
}

/**
 * Checks if the given input is an instance of H3Error.
 *
 * @param input {*} - The input to check.
 * @return {boolean} - Returns true if the input is an instance of H3Error, false otherwise.
 */
export function isError<DataT = unknown>(input: any): input is H3Error<DataT> {
  return input?.constructor?.__h3_error__ === true;
}
