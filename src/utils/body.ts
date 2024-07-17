import type { InferEventInput, ValidateFunction, H3Event } from "../types";
import { createError } from "../error";
import { validateData } from "./internal/validate";
import { parseURLEncodedBody } from "./internal/body";

/**
 * Reads body of the request and returns an ArrayBuffer of the raw body.
 *
 * @example
 * app.use("/", async (event) => {
 *   const body = await readRawBody(event);
 * });
 *
 * @param event {H3Event} H3 event or req passed by h3 handler
 *
 * @return {Uint8Array} Raw body
 */
export async function readRawBody(event: H3Event): Promise<Uint8Array> {
  return event.request.arrayBuffer().then((r) => new Uint8Array(r));
}

/**
 * Reads body of the request and returns an string (utf-8) of the raw body.
 *
 * @example
 * app.use("/", async (event) => {
 *   const body = await readTextBody(event);
 * });
 *
 * @param event {H3Event} H3 event or req passed by h3 handler
 *
 * @return {string} Text body
 */
export async function readTextBody(event: H3Event): Promise<string> {
  return event.request.text();
}

/**
 * Reads request body and tries to parse using JSON.parse or URLSearchParams.
 *
 * @example
 * app.use("/", async (event) => {
 *   const body = await readAndParseBody(event);
 * });
 *
 * @param event H3 event passed by h3 handler
 * @param encoding The character encoding to use, defaults to 'utf-8'.
 *
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body
 */
export async function readJSONBody<
  T,
  _Event extends H3Event = H3Event,
  _T = InferEventInput<"body", _Event, T>,
>(event: _Event): Promise<undefined | _T> {
  const text = await event.request.text();
  if (!text) {
    return undefined;
  }

  const contentType = event.request.headers.get("content-type") || "";
  if (contentType.startsWith("application/x-www-form-urlencoded")) {
    return parseURLEncodedBody(text) as _T;
  }

  try {
    return JSON.parse(text) as _T;
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid JSON body",
    });
  }
}

/**
 * Tries to read the request body via `readJSONBody`, then uses the provided validation function and either throws a validation error or returns the result.
 *
 * You can use a simple function to validate the body or use a library like `zod` to define a schema.
 *
 * @example
 * app.use("/", async (event) => {
 *   const body = await readValidatedJSONBody(event, (body) => {
 *     return typeof body === "object" && body !== null;
 *   });
 * });
 * @example
 * import { z } from "zod";
 *
 * app.use("/", async (event) => {
 *   const objectSchema = z.object();
 *   const body = await readValidatedJSONBody(event, objectSchema.safeParse);
 * });
 *
 * @param event The H3Event passed by the handler.
 * @param validate The function to use for body validation. It will be called passing the read request body. If the result is not false, the parsed body will be returned.
 * @throws If the validation function returns `false` or throws, a validation error will be thrown.
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body.
 * @see {readJSONBody}
 */
export async function readValidatedJSONBody<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"body", Event, T>,
>(event: Event, validate: ValidateFunction<_T>): Promise<_T> {
  const _body = await readJSONBody(event);
  return validateData(_body, validate);
}

/**
 * Constructs a FormData object from an event, after converting it to a a web request.
 *
 * @example
 * app.use("/", async (event) => {
 *   const formData = await readFormDataBody(event);
 *   const email = formData.get("email");
 *   const password = formData.get("password");
 * });
 *
 * @param event The H3Event object to read the form data from.
 */
export async function readFormDataBody(event: H3Event): Promise<FormData> {
  return event.request.formData();
}

/**
 * Captures a stream from a request.
 * @param event The H3Event object containing the request information.
 * @returns Undefined if the request can't transport a payload, otherwise a ReadableStream of the request body.
 */
export function getBodyStream(
  event: H3Event,
): undefined | ReadableStream<Uint8Array> {
  return event.request.body || undefined;
}
