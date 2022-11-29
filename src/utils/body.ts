import destr from "destr";
import type { Encoding, HTTPMethod } from "../types";
import type { H3Event } from "../event";
import { RawBodySymbol, ParsedBodySymbol } from "../types";
import { assertMethod } from "./request";

const PayloadMethods = ["PATCH", "POST", "PUT", "DELETE"] as const satisfies readonly HTTPMethod[];
/**
 * Reads body of the request and returns encoded raw string (default) or `Buffer` if encoding if falsy.
 * @param event {H3Event} H3 event or req passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use. `false` to return a `Buffer` instead of a string.
 *
 * @return {String|Buffer} Encoded raw string or raw Buffer of the body
 */
export function readRawBody(event: H3Event, encoding: false): Buffer;
// TODO remove next line after https://github.com/unjs/eslint-config/issues/4 is fixed
// eslint-disable-next-line no-redeclare
export function readRawBody(event: H3Event, encoding?: Exclude<Encoding, false>): Promise<string | Buffer | undefined>;
// eslint-disable-next-line no-redeclare
export function readRawBody (event: H3Event, encoding: Encoding = "utf8"): Buffer | Promise<string | Buffer | undefined> {
  // Ensure using correct HTTP method before attempt to read payload
  assertMethod(event, PayloadMethods);

  if (RawBodySymbol in event.node.req) {
    const buffer = event.node.req[RawBodySymbol];
    /* c8 ignore next */
    if (buffer === undefined) { throw new Error("Body is not available. "); }
    if (encoding === false) {
      return buffer;
    }
    return Promise.resolve(buffer).then(buff => buff.toString(encoding));
  }

  // Workaround for unenv issue https://github.com/unjs/unenv/issues/8
  if ("body" in (event.node.req as unknown as { "body": unknown })) {
    return Promise.resolve((event.node.req as any).body);
  }

  if (!Number.parseInt(event.node.req.headers["content-length"] || "")) {
    return Promise.resolve(undefined);
  }

  const promise = event.node.req[RawBodySymbol] = new Promise<Buffer>((resolve, reject) => {
    const bodyData: any[] = [];
    event.node.req
      .on("error", (err) => { reject(err); })
      .on("data", (chunk) => { bodyData.push(chunk); })
      .on("end", () => { resolve(Buffer.concat(bodyData)); });
  });

  return encoding ? promise.then(buff => buff.toString(encoding)) : promise;
}

/**
 * Reads request body and try to safely parse using [destr](https://github.com/unjs/destr)
 * @param event {H3Event} H3 event or req passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body
 *
 * ```ts
 * const body = await useBody(req)
 * ```
 */
export async function readBody (event: H3Event): Promise<typeof event.node.req[typeof ParsedBodySymbol]> {
  if (ParsedBodySymbol in event.node.req) {
    return event.node.req[ParsedBodySymbol];
  }

  // TODO: Handle buffer
  const body = await readRawBody(event) as string;

  // Forms
  if (event.node.req.headers["content-type"] === "application/x-www-form-urlencoded") {
    const parsedForm = Object.fromEntries(new URLSearchParams(body));
    return parsedForm as typeof event.node.req[typeof ParsedBodySymbol];
  }

  // JSON body
  const json = destr(body) as typeof event.node.req[typeof ParsedBodySymbol];
  event.node.req[ParsedBodySymbol] = json;
  return json;
}
