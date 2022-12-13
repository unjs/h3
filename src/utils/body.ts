import destr from "destr";
import type { Encoding, HTTPMethod } from "../types";
import type { H3Event } from "../event";
import { assertMethod } from "./request";

const RawBodySymbol = Symbol.for("h3RawBody");
const ParsedBodySymbol = Symbol.for("h3ParsedBody");

const PayloadMethods: HTTPMethod[] = ["PATCH", "POST", "PUT", "DELETE"];

/**
 * Reads body of the request and returns encoded raw string (default) or `Buffer` if encoding if falsy.
 * @param event {H3Event} H3 event or req passed by h3 handler
 * @param encoding {Encoding} encoding="utf-8" - The character encoding to use.
 *
 * @return {String|Buffer} Encoded raw string or raw Buffer of the body
 */
export function readRawBody <E extends Encoding = "utf8"> (event: H3Event, encoding = "utf8" as E): E extends false ? Promise<Buffer | undefined> : Promise<string | undefined> {
  // Ensure using correct HTTP method before attempt to read payload
  assertMethod(event, PayloadMethods);

  if (RawBodySymbol in event.node.req) {
    const promise = Promise.resolve((event.node.req as any)[RawBodySymbol]);
    return encoding ? promise.then(buff => buff.toString(encoding)) : promise;
  }

  // Workaround for unenv issue https://github.com/unjs/unenv/issues/8
  if ("body" in event.node.req) {
    return Promise.resolve((event.node.req as any).body);
  }

  if (!Number.parseInt(event.node.req.headers["content-length"] || "")) {
    return Promise.resolve(undefined);
  }

  const promise = (event.node.req as any)[RawBodySymbol] = new Promise<Buffer>((resolve, reject) => {
    const bodyData: any[] = [];
    event.node.req
      .on("error", (err) => { reject(err); })
      .on("data", (chunk) => { bodyData.push(chunk); })
      .on("end", () => { resolve(Buffer.concat(bodyData)); });
  });

  const result = encoding ? promise.then(buff => buff.toString(encoding)) : promise;
  return result as E extends false ? Promise<Buffer | undefined> : Promise<string | undefined>;
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
export async function readBody<T=any> (event: H3Event): Promise<T> {
  if (ParsedBodySymbol in event.node.req) {
    return (event.node.req as any)[ParsedBodySymbol];
  }

  // TODO: Handle buffer
  const body = await readRawBody(event) as string;

  if (event.node.req.headers["content-type"] === "application/x-www-form-urlencoded") {
    const parsedForm = Object.fromEntries(new URLSearchParams(body));
    return parsedForm as unknown as T;
  }

  const json = destr(body) as T;
  (event.node.req as any)[ParsedBodySymbol] = json;
  return json;
}
