import type { App } from "../../app";
import type { EventHandler, EventHandlerResponse } from "../../types";
import type {
  NodeMiddleware,
  NodeIncomingMessage,
  NodeServerResponse,
  NodeHandler,
} from "./types";
import { _kRaw, getNodeContext } from "../../event";
import { createError, isError, sendError } from "../../error";
import { defineEventHandler, isEventHandler } from "../../handler";
import { setResponseStatus } from "../../utils";
import { EventWrapper } from "../../event";
import { NodeEvent } from "./event";

export function toNodeHandler(app: App): NodeHandler {
  const nodeHandler: NodeHandler = async function (req, res) {
    const rawEvent = new NodeEvent(req, res);
    const event = new EventWrapper(rawEvent);
    try {
      await app.handler(event);
    } catch (_error: any) {
      const error = createError(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }

      // #754 Make sure hooks see correct status code and message
      setResponseStatus(event, error.statusCode, error.statusMessage);

      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event[_kRaw].handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }

      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onBeforeResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return nodeHandler;
}

export function fromNodeHandler(
  handler: NodeHandler | NodeMiddleware,
): EventHandler {
  if (isEventHandler(handler)) {
    return handler;
  }
  if (typeof handler !== "function") {
    throw new (TypeError as any)(
      "Invalid handler. It should be a function:",
      handler,
    );
  }
  return defineEventHandler((event) => {
    const nodeCtx = getNodeContext(event);
    if (!nodeCtx) {
      throw new Error(
        "[h3] Executing Node.js middleware is not supported in this server!",
      );
    }
    return _callNodeHandler(
      handler,
      nodeCtx.req,
      nodeCtx.res,
    ) as EventHandlerResponse;
  });
}

// --- Internal ---

function _callNodeHandler(
  handler: NodeMiddleware,
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
