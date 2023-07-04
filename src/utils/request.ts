import { getQuery as _getQuery } from "ufo";
import { createError } from "../error";
import type { HTTPMethod } from "../types";
import type { H3Event } from "../event";

export function getQuery(event: H3Event) {
  return _getQuery(event.node.req.url || "");
}

export function getRouterParams(
  event: H3Event
): NonNullable<H3Event["context"]["params"]> {
  // Fallback object needs to be returned in case router is not used (#149)
  return event.context.params || {};
}

export function getRouterParam(
  event: H3Event,
  name: string
): string | undefined {
  const params = getRouterParams(event);

  return params[name];
}

export function getMethod(
  event: H3Event,
  defaultMethod: HTTPMethod = "GET"
): HTTPMethod {
  return (event.node.req.method || defaultMethod).toUpperCase() as HTTPMethod;
}

export function isMethod(
  event: H3Event,
  expected: HTTPMethod | HTTPMethod[],
  allowHead?: boolean
) {
  const method = getMethod(event);

  if (allowHead && method === "HEAD") {
    return true;
  }

  if (typeof expected === "string") {
    if (method === expected) {
      return true;
    }
  } else if (expected.includes(method)) {
    return true;
  }

  return false;
}

export function assertMethod(
  event: H3Event,
  expected: HTTPMethod | HTTPMethod[],
  allowHead?: boolean
) {
  if (!isMethod(event, expected, allowHead)) {
    throw createError({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed.",
    });
  }
}
