import type {
  InferEventInput,
  StandardSchemaV1,
  ValidateFunction,
  H3Event,
} from "../types";
import { createError } from "../error";
import { validateData } from "./internal/validate";
import { parseURLEncodedBody } from "./internal/body";

/**
 * Reads request body and tries to parse using JSON.parse or URLSearchParams.
 *
 * @example
 * app.use("/", async (event) => {
 *   const body = await readBody(event);
 * });
 *
 * @param event H3 event passed by h3 handler
 * @param encoding The character encoding to use, defaults to 'utf-8'.
 *
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body
 */
export async function readBody<
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

export async function readValidatedBody<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"body", Event, T>,
>(event: Event, validate: ValidateFunction<_T> | StandardSchemaV1): Promise<_T>;
export async function readValidatedBody<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"body", Event, T>,
>(event: Event, validate: ValidateFunction<_T> | StandardSchemaV1): Promise<_T>;
/**
 * Tries to read the request body via `readBody`, then uses the provided validation function or schema and either throws a validation error or returns the result.
 *
 * You can use a simple function to validate the body or use a library like `valibot` or `zod` to define the schema.
 *
 * @example
 * app.use("/", async (event) => {
 *   const body = await readValidatedBody(event, (body) => {
 *     return typeof body === "object" && body !== null;
 *   });
 * });
 * @example
 * import * as v from "valibot";
 *
 * app.use("/", async (event) => {
 *   const body = await readValidatedBody(
 *     event,
 *     v.object({
 *      name: v.string(),
 *     }),
 *   );
 * });
 * @example
 * import * as z from "zod";
 *
 * app.use("/", async (event) => {
 *   const body = await readValidatedBody(
 *     event,
 *     z.object({
 *      name: z.string(),
 *     }),
 *   );
 * });
 *
 * @param event The H3Event passed by the handler.
 * @param validateFnOrSchema The function function or schema to use for body validation. It will be called passing the read request body. If validation is successful, the parsed body will be returned.
 * @throws If the validation function returns `false` or throws, a validation error will be thrown.
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body.
 * @see {readBody}
 */
export async function readValidatedBody<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"body", Event, T>,
>(event: Event, validate: any) {
  const _body = await readBody(event);
  return validateData(_body, validate);
}
