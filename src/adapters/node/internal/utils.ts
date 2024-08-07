import type { IncomingMessage, ServerResponse } from "node:http";
import type { Readable as NodeReadableStream } from "node:stream";
import { splitSetCookieString } from "cookie-es";
import type { NodeHandler, NodeMiddleware } from "../../../types/node";
import { createError } from "../../../error";
import {
  sanitizeStatusCode,
  sanitizeStatusMessage,
} from "../../../utils/sanitize";

export const kNodeReq: unique symbol =
  /* @__PURE__ */ Symbol.for("h3.node.request");
export const kNodeRes: unique symbol =
  /* @__PURE__ */ Symbol.for("h3.node.response");
export const kNodeInspect = /* @__PURE__ */ Symbol.for(
  "nodejs.util.inspect.custom",
);

export function sendNodeResponse(
  nodeRes: ServerResponse,
  handlerRes?: BodyInit | null,
): Promise<void> {
  // Web Response
  if (handlerRes instanceof Response) {
    for (const [key, value] of handlerRes.headers) {
      if (key === "set-cookie") {
        for (const setCookie of splitSetCookieString(value)) {
          nodeRes.appendHeader(key, setCookie);
        }
      } else {
        nodeRes.setHeader(key, value);
      }
    }

    if (handlerRes.status) {
      nodeRes.statusCode = sanitizeStatusCode(handlerRes.status);
    }
    if (handlerRes.statusText) {
      nodeRes.statusMessage = sanitizeStatusMessage(handlerRes.statusText);
    }
    if (handlerRes.redirected) {
      nodeRes.setHeader("location", handlerRes.url);
    }
    handlerRes = handlerRes.body; // Next step will send body as stream!
  }

  // Native Web Streams
  // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
  if (typeof (handlerRes as ReadableStream)?.pipeTo === "function") {
    return (handlerRes as ReadableStream)
      .pipeTo(
        new WritableStream({
          write: (chunk) => {
            nodeRes.write(chunk);
          },
        }),
      )
      .then(() => endNodeResponse(nodeRes));
  }

  // Node.js Readable Streams
  // https://nodejs.org/api/stream.html#readable-streams
  if (
    typeof (handlerRes as unknown as NodeReadableStream)?.pipe === "function"
  ) {
    return new Promise<void>((resolve, reject) => {
      // Pipe stream to response
      (handlerRes as unknown as NodeReadableStream).pipe(nodeRes);

      // Handle stream events (if supported)
      if ((handlerRes as unknown as NodeReadableStream).on) {
        (handlerRes as unknown as NodeReadableStream).on("end", resolve);
        (handlerRes as unknown as NodeReadableStream).on("error", reject);
      }

      // Handle request aborts
      nodeRes.once("close", () => {
        (handlerRes as unknown as NodeReadableStream).destroy?.();
        // https://react.dev/reference/react-dom/server/renderToPipeableStream
        (handlerRes as any).abort?.();
      });
    }).then(() => endNodeResponse(nodeRes));
  }

  // Send as string or buffer
  return endNodeResponse(nodeRes, handlerRes);
}

export function endNodeResponse(
  res: ServerResponse,
  chunk?: any,
): Promise<void> {
  return new Promise((resolve) => {
    res.end(chunk, resolve);
  });
}

export function callNodeHandler(
  handler: NodeHandler | NodeMiddleware,
  req: IncomingMessage,
  res: ServerResponse,
) {
  const isMiddleware = handler.length > 2;
  return new Promise((resolve, reject) => {
    const next = (err?: Error) => {
      if (isMiddleware) {
        res.off("close", next);
        res.off("error", next);
      }
      return err ? reject(createError(err)) : resolve(undefined);
    };
    try {
      const returned = handler(req, res, next);
      if (isMiddleware && returned === undefined) {
        res.once("close", next);
        res.once("error", next);
      } else {
        resolve(returned);
      }
    } catch (error) {
      next(error as Error);
    }
  });
}
