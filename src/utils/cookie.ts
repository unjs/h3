import { parse, serialize } from "cookie-es";
import type { CookieSerializeOptions } from "cookie-es";
import type { H3Event } from "../event";
import { appendHeader } from "./response";

/**
 * Parse the request to get HTTP Cookie header string and returning an object of all cookie name-value pairs.
 * @param event {H3Event} H3 event or req passed by h3 handler
 * @returns Object of cookie name-value pairs
 * ```ts
 * const cookies = parseCookies(event)
 * ```
 */
export function parseCookies (event: H3Event): Record<string, string> {
  return parse(event.req.headers.cookie || "");
}

/** @deprecated Use `h3.parseCookies` */
export const useCookies = parseCookies;

/**
 * Get a cookie value by name.
 * @param event {H3Event} H3 event or req passed by h3 handler
 * @param name Name of the cookie to get
 * @returns {*} Value of the cookie (String or undefined)
 * ```ts
 * const authorization = useCookie(request, 'Authorization')
 * ```
 */
export function getCookie (event: H3Event, name: string): string | undefined {
  return parseCookies(event)[name];
}

/** @deprecated Use `h3.getCookie` */
export const useCookie = getCookie;

/**
 * Set a cookie value by name.
 * @param event {H3Event} H3 event or res passed by h3 handler
 * @param name Name of the cookie to set
 * @param value Value of the cookie to set
 * @param serializeOptions {CookieSerializeOptions} Options for serializing the cookie
 * ```ts
 * setCookie(res, 'Authorization', '1234567')
 * ```
 */
export function setCookie (event: H3Event, name: string, value: string, serializeOptions?: CookieSerializeOptions) {
  const cookieStr = serialize(name, value, {
    path: "/",
    ...serializeOptions
  });
  appendHeader(event, "Set-Cookie", cookieStr);
}

/**
 * Set a cookie value by name.
 * @param event {H3Event} H3 event or res passed by h3 handler
 * @param name Name of the cookie to delete
 * @param serializeOptions {CookieSerializeOptions} Cookie options
 * ```ts
 * deleteCookie(res, 'SessionId')
 * ```
 */
export function deleteCookie (event: H3Event, name: string, serializeOptions?: CookieSerializeOptions) {
  setCookie(event, name, "", {
    ...serializeOptions,
    maxAge: 0
  });
}
