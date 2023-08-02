import { IncomingMessage as NodeIncomingMessage } from "unenv/runtime/node/http/_request";
import { ServerResponse as NodeServerResponse } from "unenv/runtime/node/http/_response";
import type { App } from "../app";
import type { HTTPMethod } from "../types";
import { createError, isError, sendError } from "../error";
import { H3Event, createEvent } from "../event";

export interface PlainRequest {
  _eventOverrides?: Partial<H3Event>;
  context?: Record<string, unknown>;

  method: string;
  path: string;
  headers: HeadersInit;
  body?: null | BodyInit;
}

export interface PlainResponse {
  status: number;
  statusText: string;
  headers: [string, string][];
  body?: unknown;
}

export type PlainHandler = (request: PlainRequest) => Promise<PlainResponse>;

export function toPlainHandler(app: App) {
  const handler: PlainHandler = async (request) => {
    // Normalize request
    const path = request.path;
    const method = (request.method || "GET").toUpperCase() as HTTPMethod;
    const headers = new Headers(request.headers);

    // Shim for Node.js request and response objects
    // TODO: Remove in next major version
    const nodeReq = new NodeIncomingMessage();
    const nodeRes = new NodeServerResponse(nodeReq);

    // Fill node request properties
    nodeReq.method = method;
    nodeReq.url = path;
    // TODO: Normalize with array merge and lazy getter
    nodeReq.headers = Object.fromEntries(headers.entries());

    // Create new event
    const event = createEvent(nodeReq, nodeRes);

    // Fill internal event properties
    event._method = method;
    event._path = path;
    event._headers = headers;
    if (request.body) {
      event._body = request.body;
    }
    if (request._eventOverrides) {
      Object.assign(event, request._eventOverrides);
    }
    if (request.context) {
      Object.assign(event.context, request.context);
    }

    // Run app handler logic
    try {
      await app.handler(event);
    } catch (_error: any) {
      const error = createError(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (!event.handled) {
        if (error.unhandled || error.fatal) {
          console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error); // eslint-disable-line no-console
        }
        await sendError(event, error, !!app.options.debug);
      }
    }

    return {
      status: nodeRes.statusCode,
      statusText: nodeRes.statusMessage,
      headers: normalizeUnenvHeaders(nodeRes._headers),
      body: nodeRes._data,
    };
  };

  return handler;
}

// --- Internal ---

function normalizeUnenvHeaders(
  input: Record<string, undefined | string | string[]>
) {
  // TODO: Split cookie
  const headers: [string, string][] = [];
  for (const key in input) {
    const value = input[key];
    if (Array.isArray(value)) {
      for (const _value of value) {
        headers.push([key, _value]);
      }
    } else if (value) {
      headers.push([key, value]);
    }
  }
  return headers;
}
