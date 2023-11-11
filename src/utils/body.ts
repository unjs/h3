import type { IncomingMessage } from "node:http";
import destr from "destr";
import type { Encoding, HTTPMethod, InferEventInput } from "../types";
import type { H3Event } from "../event";
import { createError } from "../error";
import { MultiPartData, parse as parseMultipartData } from "./internal/multipart";
import { assertMethod, getRequestHeader, toWebRequest } from "./request";
import { ValidateFunction, validateData } from "./internal/validate";
import { hasProp } from "./internal/object";

export type { MultiPartData } from "./internal/multipart";

const RawBodySymbol = Symbol.for("h3RawBody");
const ParsedBodySymbol = Symbol.for("h3ParsedBody");
type InternalRequest<T = any> = IncomingMessage & {
  [RawBodySymbol]?: Promise<Buffer | undefined>;
  [ParsedBodySymbol]?: T;
  body?: string | undefined;
};

const PayloadMethods: HTTPMethod[] = ["PATCH", "POST", "PUT", "DELETE"];

/**
 * Reads body of the request and returns encoded raw string (default), or `Buffer` if encoding is falsy.
 * @param event {H3Event} H3 event or req passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {String|Buffer} Encoded raw string or raw Buffer of the body
 */
export function readRawBody<E extends Encoding = "utf8">(
  event: H3Event,
  encoding = "utf8" as E,
): E extends false ? Promise<Buffer | undefined> : Promise<string | undefined> {
  // Ensure using correct HTTP method before attempt to read payload
  assertMethod(event, PayloadMethods);

  // Reuse body if already read
  const _rawBody =
    event._requestBody ||
    event.web?.request?.body ||
    (event.node.req as any)[RawBodySymbol] ||
    (event.node.req as any).body; /* unjs/unenv #8 */
  if (_rawBody) {
    const promise = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          _resolved
            .pipeTo(
              new WritableStream({
                write(chunk) {
                  chunks.push(chunk);
                },
                close() {
                  resolve(Buffer.concat(chunks));
                },
                abort(reason) {
                  reject(reason);
                },
              }),
            )
            .catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          _resolved
            .on("data", (chunk: any) => {
              chunks.push(chunk);
            })
            .on("end", () => {
              resolve(Buffer.concat(chunks));
            })
            .on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      return Buffer.from(_resolved);
    });
    return encoding
      ? promise.then((buff) => buff.toString(encoding))
      : (promise as Promise<any>);
  }

  if (!Number.parseInt(event.node.req.headers["content-length"] || "")) {
    return Promise.resolve(undefined);
  }

  const promise = ((event.node.req as any)[RawBodySymbol] = new Promise<Buffer>(
    (resolve, reject) => {
      const bodyData: any[] = [];
      event.node.req
        .on("error", (err) => {
          reject(err);
        })
        .on("data", (chunk) => {
          bodyData.push(chunk);
        })
        .on("end", () => {
          resolve(Buffer.concat(bodyData));
        });
    },
  ));

  const result = encoding
    ? promise.then((buff) => buff.toString(encoding))
    : promise;
  return result as E extends false
    ? Promise<Buffer | undefined>
    : Promise<string | undefined>;
}

/**
 * Reads request body and tries to safely parse using [destr](https://github.com/unjs/destr).
 * @param event {H3Event} H3 event passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body
 *
 * ```ts
 * const body = await readBody(event)
 * ```
 */

export async function readBody<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"body", Event, T>,
>(event: Event, options: { strict?: boolean } = {}): Promise<_T> {
  const request = event.node.req as InternalRequest<T>;
  if (hasProp(request, ParsedBodySymbol)) {
    return request[ParsedBodySymbol] as _T;
  }

  const contentType = request.headers["content-type"] || "";
  const body = await readRawBody(event);

  let parsed: T;

  if (contentType === "application/json") {
    parsed = _parseJSON(body, options.strict ?? true) as T;
  } else if (contentType.startsWith("application/x-www-form-urlencoded")) {
    // TODO: Extract and pass charset as option (; charset=utf-8)
    parsed = _parseURLEncodedBody(body!) as T;
  } else if (contentType.startsWith("text/")) {
    parsed = body as T;
  } else {
    parsed = _parseJSON(body, options.strict ?? false) as T;
  }

  request[ParsedBodySymbol] = parsed;
  return parsed as unknown as _T;
}


/**
 * Tries to read the request body via `readBody`, then uses the provided validation function and either throws a validation error or returns the result.
 * @param event {H3Event} H3 event passed by h3 handler
 * @param validate {ValidateFunction} The function to use for body validation. It will be called passing the read request body. If the result is not false, the parsed body will be returned.
 * @throws If the validation function returns `false` or throws, a validation error will be thrown.
 *
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body
 *
 * 
 * ```ts
 * const body = await readValidatedBody(event, (body) => {
 *  if (typeof body !== "object") {
 *    return false
 *  }
 *  return true
 * })
 * ```
 * 
 * ```ts
 * import { z } from 'zod'
 * const objectSchema = z.object()
 * const body = await readValidatedBody(event, objectSchema.safeParse)
 * ```
 */
export async function readValidatedBody<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"body", Event, T>,
>(event: Event, validate: ValidateFunction<_T>): Promise<_T> {
  const _body = await readBody(event, { strict: true });
  return validateData(_body, validate);
}

/**
 * Tries to read the request body as multipart form.
 * @param event {H3Event} H3 event passed by h3 handler
 *
 * @return {MultiPartData[]|undefined} The parsed form data. If no form could be detected because the content type is not multipart/form-data or no boundary could be found.
 *
 * ```ts
 * const formData = await readMultipartFormData(event)
 * // The result could look like:
 * // [
 * //   {
 * //     "data": "other",
 * //     "name": "baz",
 * //   },
 * //   {
 * //     "data": "something",
 * //     "name": "some-other-data",
 * //   },
 * // ]
 * ```
 */
export async function readMultipartFormData(event: H3Event): Promise<MultiPartData[] | undefined> {
  const contentType = getRequestHeader(event, "content-type");
  if (!contentType || !contentType.startsWith("multipart/form-data")) {
    return;
  }
  const boundary = contentType.match(/boundary=([^;]*)(;|$)/i)?.[1];
  if (!boundary) {
    return;
  }
  const body = await readRawBody(event, false);
  if (!body) {
    return;
  }
  return parseMultipartData(body, boundary);
}

/**
 * Constructs a FormData object from an event.
 * @param event {H3Event}
 *
 * ```ts
 * const eventHandler = event => {
 *   const formData = await readFormData(event)
 *   const email = formData.get("email")
 *   const password = formData.get("password")
 *  }
 * ```
 */
export async function readFormData(event: H3Event) : Promise<FormData> {
  return await toWebRequest(event).formData();
}

export function getRequestWebStream(
  event: H3Event,
): undefined | ReadableStream {
  if (!PayloadMethods.includes(event.method)) {
    return;
  }
  return (
    event.web?.request?.body ||
    (event._requestBody as ReadableStream) ||
    new ReadableStream({
      start: (controller) => {
        event.node.req.on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        event.node.req.on("end", () => {
          controller.close();
        });
        event.node.req.on("error", (err) => {
          controller.error(err);
        });
      },
    })
  );
}

// --- Internal ---

function _parseJSON(body = "", strict: boolean) {
  if (!body) {
    return undefined;
  }
  try {
    return destr(body, { strict });
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid JSON body",
    });
  }
}

function _parseURLEncodedBody(body: string) {
  const form = new URLSearchParams(body);
  const parsedForm: Record<string, any> = Object.create(null);
  for (const [key, value] of form.entries()) {
    if (hasProp(parsedForm, key)) {
      if (!Array.isArray(parsedForm[key])) {
        parsedForm[key] = [parsedForm[key]];
      }
      parsedForm[key].push(value);
    } else {
      parsedForm[key] = value;
    }
  }
  return parsedForm as unknown;
}
