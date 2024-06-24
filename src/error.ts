import { _kRaw } from "./event";
import { hasProp } from "./utils/internal/object";
import { sanitizeStatusMessage, sanitizeStatusCode } from "./utils/sanitize";
import { MIMES } from "./utils/internal/consts";

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
 * If a string is provided, it will be used as the error `message`.
 *
 * @example
 * // String error where `statusCode` defaults to `500`
 * throw createError("An error occurred");
 * // Object error
 * throw createError({
 *   statusCode: 400,
 *   statusMessage: "Bad Request",
 *   message: "Invalid input",
 *   data: { field: "email" }
 * });
 *
 *
 * @return {H3Error} - An instance of H3Error.
 *
 * @remarks
 * - Typically, `message` contains a brief, human-readable description of the error, while `statusMessage` is specific to HTTP responses and describes
 * the status text related to the response status code.
 * - In a client-server context, using a short `statusMessage` is recommended because it can be accessed on the client side. Otherwise, a `message`
 * passed to `createError` on the server will not propagate to the client.
 * - Consider avoiding putting dynamic user input in the `message` to prevent potential security issues.
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
    err.statusMessage = sanitizeStatusMessage(err.statusMessage);
  }

  if (input.fatal !== undefined) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== undefined) {
    err.unhandled = input.unhandled;
  }

  return err;
}

export function errorToResponse(error: Error | H3Error, debug?: boolean) {
  const h3Error = isError(error) ? error : createError(error);
  const response = {
    error: h3Error,
    status: h3Error.statusCode,
    statusText: h3Error.statusMessage,
    headers: {
      "content-type": MIMES.json,
    },
    body: JSON.stringify(
      {
        statusCode: h3Error.statusCode,
        statusMessage: h3Error.statusMessage,
        data: h3Error.data,
        stack: debug
          ? (h3Error.stack || "").split("\n").map((l) => l.trim())
          : undefined,
      },
      undefined,
      2,
    ),
  };
  return response;
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
