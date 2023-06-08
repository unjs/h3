import destr from "destr";
import type { Encoding, HTTPMethod } from "../types";
import type { H3Event } from "../event";
import { parse as parseMultipartData } from "./internal/multipart";
import { assertMethod } from "./request";
import { getRequestHeader } from "./headers";

export type { MultiPartData } from "./internal/multipart";

const RawBodySymbol = Symbol.for("h3RawBody");
const ParsedBodySymbol = Symbol.for("h3ParsedBody");

const PayloadMethods: HTTPMethod[] = ["PATCH", "POST", "PUT", "DELETE"];

/**
 * Reads body of the request and returns encoded raw string (default) or `Buffer` if encoding if falsy.
 * Node only.
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

  if (event.request) {
    if (!Number.parseInt(getRequestHeader(event, "content-length") || "")) {
      return Promise.resolve(undefined);
    }
    // we clone the request so we can re-use readBody/ readBodyRaw later.
    const request = event.request.clone();

    const result = encoding
      ? request.text().then((str) => str)
      : request
          .arrayBuffer()
          .then((buffer) => Buffer.from(new Uint8Array(buffer)));

    return result as E extends false
      ? Promise<Buffer | undefined>
      : Promise<string | undefined>;
  }
  // Reuse body if already read
  const _rawBody =
    (event.node.req as any)[RawBodySymbol] ||
    (event.node.req as any).body; /* unjs/unenv #8 */
  if (_rawBody) {
    const promise = Promise.resolve(_rawBody).then((_resolved) =>
      Buffer.isBuffer(_resolved) ? _resolved : Buffer.from(_resolved)
    );
    return encoding
      ? promise.then((buff) => buff.toString(encoding))
      : (promise as Promise<any>);
  }

  if (!Number.parseInt(getRequestHeader(event, "content-length") || "")) {
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
    }
  ));

  const result = encoding
    ? promise.then((buff) => buff.toString(encoding))
    : promise;
  return result as E extends false
    ? Promise<Buffer | undefined>
    : Promise<string | undefined>;
}

/**
 * Reads request body and try to safely parse using [destr](https://github.com/unjs/destr)
 * @param event {H3Event} H3 event or req passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body
 *
 * ```ts
 * const body = await readBody(req)
 * ```
 */
export async function readBody<T = any>(event: H3Event): Promise<T> {
  const contentType =
    getRequestHeader(event, "content-type")?.toLowerCase() || "";
  if (event.request) {
    const request = event.request.clone(); // Clone the request for re-use.
    if (contentType === "application/json") {
      return request.json();
    }
    if (contentType === "application/octet-stream") {
      return request.arrayBuffer() as T;
    }
    if (contentType === "multipart/form-data") {
      return request.formData() as T;
    }
    if (contentType === "text") {
      return request.text() as T;
    }
    if (contentType === "application/x-www-form-urlencoded") {
      const text = await request.text();
      return parseUrlSearchParams(new URLSearchParams(text)) as T;
    }
    return request.blob() as T; // We return a blob if we don't know the type.
  }

  if (ParsedBodySymbol in event.node.req) {
    return (event.node.req as any)[ParsedBodySymbol];
  }

  const body = await readRawBody(event, "utf8");

  if (contentType === "application/x-www-form-urlencoded") {
    const form = new URLSearchParams(body);
    return parseUrlSearchParams(form) as T;
  }

  const json = destr(body) as T;
  (event.node.req as any)[ParsedBodySymbol] = json;
  return json;
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
  if (event.request) {
    return event.request.clone().formData();
  }
  const body = await readRawBody(event, false);
  if (!body) {
    return;
  }
  return parseMultipartData(body, boundary);
}

const parseUrlSearchParams = (form: URLSearchParams) => {
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
  return parsedForm;
};
