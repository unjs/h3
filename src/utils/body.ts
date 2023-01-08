import destr from "destr";
import type { Encoding, HTTPMethod } from "../types";
import type { H3Event } from "../event";
import { parse as parseMultipartData } from "./multipart";
import { assertMethod, getRequestHeader } from "./request";

const RawBodySymbol = Symbol.for("h3RawBody");
const ParsedBodySymbol = Symbol.for("h3ParsedBody");
type InternalRequest<T=any> = IncomingMessage & {
  [RawBodySymbol]?: Promise<Buffer | undefined>
  [ParsedBodySymbol]?: T
  body?: string | undefined
}

const PayloadMethods: HTTPMethod[] = ["PATCH", "POST", "PUT", "DELETE"];

/**
 * Reads body of the request and returns encoded raw string (default), or `Buffer` if encoding is false.
 * @param event {H3Event} H3 event or req passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {String|Buffer} Encoded raw string or raw Buffer of the body
 */
export function readRawBody<E extends Encoding = "utf8">(
  event: H3Event,
  encoding = "utf8" as E
): E extends false ? Promise<Buffer | undefined> : Promise<string | undefined> {
  // Ensure using correct HTTP method before attempt to read payload
  assertMethod(event, PayloadMethods);

  const request = event.node.req as InternalRequest

  // Workaround for unenv issue https://github.com/unjs/unenv/issues/8
  if ('body' in request) {
    return Promise.resolve(request.body)
  }

  let body = request[RawBodySymbol]
  if (!body) {
    if (!Number.parseInt(request.headers['content-length'] || '')) {
      return Promise.resolve(undefined)
    }

    body = request[RawBodySymbol] = new Promise<Buffer | undefined>((resolve, reject) => {
      const bodyData: any[] = []
      request
        .on('error', (err) => { reject(err) })
        .on('data', (chunk) => { bodyData.push(chunk) })
        .on('end', () => { resolve(Buffer.concat(bodyData)) })
    })
  }

  return encoding ? body.then(buff => buff?.toString(encoding)) : body
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
export async function readBody<T=any> (event: H3Event): Promise<T | undefined | string> {
  const request = event.node.req as InternalRequest<T>
  if (ParsedBodySymbol in request) {
    return request[ParsedBodySymbol]
  }

  const body = await readRawBody(event)
  const contentType = request.headers['content-type']
  if (contentType === 'application/x-www-form-urlencoded') {
    const form = new URLSearchParams(body);
    const parsedForm: Record<string, any> = Object.create(null);
    for (const [key, value] of form.entries()) {
      if (key in parsedForm) {
        if (!Array.isArray(parsedForm[key])) {
          parsedForm[key] = [parsedForm[key]];
        }
        parsedForm[key].push(value);
      } else {
        parsedForm[key] = value;
      }
    }
    return parsedForm as unknown as T;
  } else if (contentType === 'application/json' || contentType === undefined) {
    const json = destr(body, { strict: true }) as T
    request[ParsedBodySymbol] = json
    return json
  } else if (contentType === 'text/plain') {
    return body
  } else {
    throw new Error(`Unsupported content-type: ${contentType}`)
  }
}

export async function readMultipartFormData(event: H3Event) {
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
