import type { Readable as NodeReadableStream } from "node:stream";
import type { RawResponse } from "../types/_event";
import type {
  NodeHandler,
  NodeIncomingMessage,
  NodeMiddleware,
  NodeServerResponse,
} from "./types";
import { _kRaw } from "../event";
import { createError } from "../error";

export function _callNodeHandler(
  handler: NodeHandler | NodeMiddleware,
  req: NodeIncomingMessage,
  res: NodeServerResponse,
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

export function _readBodyStream(
  req: NodeIncomingMessage,
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      req.once("end", () => {
        controller.close();
      });
      req.once("error", (err) => {
        controller.error(err);
      });
    },
  });
}

export function _sendResponse(
  res: NodeServerResponse,
  data: RawResponse,
): Promise<void> {
  // Native Web Streams
  // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
  if (typeof (data as ReadableStream)?.pipeTo === "function") {
    return (data as ReadableStream)
      .pipeTo(
        new WritableStream({
          write: (chunk) => {
            res.write(chunk);
          },
        }),
      )
      .then(() => _endResponse(res));
  }

  // Node.js Readable Streams
  // https://nodejs.org/api/stream.html#readable-streams
  if (typeof (data as NodeReadableStream)?.pipe === "function") {
    return new Promise<void>((resolve, reject) => {
      // Pipe stream to response
      (data as NodeReadableStream).pipe(res);

      // Handle stream events (if supported)
      if ((data as NodeReadableStream).on) {
        (data as NodeReadableStream).on("end", resolve);
        (data as NodeReadableStream).on("error", reject);
      }

      // Handle request aborts
      res.once("close", () => {
        (data as NodeReadableStream).destroy?.();
        // https://react.dev/reference/react-dom/server/renderToPipeableStream
        (data as any).abort?.();
      });
    }).then(() => _endResponse(res));
  }

  // Send as string or buffer
  return _endResponse(res, data);
}

export function _endResponse(
  res: NodeServerResponse,
  chunk?: any,
): Promise<void> {
  return new Promise((resolve) => {
    res.end(chunk, resolve);
  });
}

export function _normalizeHeaders(
  headers: Record<string, string | null | undefined | number | string[]>,
): Record<string, string> {
  const normalized: Record<string, string> = Object.create(null);
  for (const [key, value] of Object.entries(headers)) {
    normalized[key] = Array.isArray(value)
      ? value.join(", ")
      : (value as string);
  }
  return normalized;
}

const payloadMethods = ["PATCH", "POST", "PUT", "DELETE"] as string[];

export function _readBody(
  req: NodeIncomingMessage,
): undefined | Promise<Uint8Array | undefined> {
  // Check if request method requires a payload
  if (!req.method || !payloadMethods.includes(req.method?.toUpperCase())) {
    return;
  }

  // Make sure either content-length or transfer-encoding/chunked is set
  if (!Number.parseInt(req.headers["content-length"] || "")) {
    const isChunked = (req.headers["transfer-encoding"] || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)
      .includes("chunked");
    if (!isChunked) {
      return;
    }
  }

  // Read body
  return new Promise((resolve, reject) => {
    const bodyData: any[] = [];
    req
      .on("data", (chunk) => {
        bodyData.push(chunk);
      })
      .once("error", (err) => {
        reject(err);
      })
      .once("end", () => {
        resolve(Buffer.concat(bodyData));
      });
  });
}
