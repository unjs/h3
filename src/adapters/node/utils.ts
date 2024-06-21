import type { App } from "../../app";
import type { EventHandler, EventHandlerResponse, H3Event } from "../../types";
import type {
  NodeHandler,
  NodeIncomingMessage,
  NodeMiddleware,
  NodeServerResponse,
} from "./types";
import { _kRaw } from "../../event";
import { createError, isError, sendError } from "../../error";
import { defineEventHandler, isEventHandler } from "../../handler";
import { setResponseStatus } from "../../utils";
import { EventWrapper } from "../../event";
import { NodeEvent } from "./event";
import { _callNodeHandler } from "./_internal";

/**
 * Convert H3 app instance to a NodeHandler with (IncomingMessage, ServerResponse) => void signature.
 */
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
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return nodeHandler;
}

/**
 * Convert a Node.js handler function (req, res, next?) to an EventHandler.
 *
 * **Note:** The returned event handler requires to be executed with h3 Node.js handler.
 */
export function fromNodeHandler(handler: NodeMiddleware): EventHandler;
export function fromNodeHandler(handler: NodeHandler): EventHandler;
export function fromNodeHandler(
  handler: NodeHandler | NodeMiddleware,
): EventHandler {
  if (isEventHandler(handler)) {
    return handler;
  }
  if (typeof handler !== "function") {
    throw new TypeError(`Invalid handler. It should be a function: ${handler}`);
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

/***
 * Create a H3Event object from a Node.js request and response.
 */
export function fromNodeRequest(
  req: NodeIncomingMessage,
  res: NodeServerResponse,
): H3Event {
  const rawEvent = new NodeEvent(req, res);
  const event = new EventWrapper(rawEvent);
  return event;
}

export function getNodeContext(
  event: H3Event,
): undefined | ReturnType<NodeEvent["getContext"]> {
  const raw = event[_kRaw] as NodeEvent;
  if (!(raw?.constructor as any)?.isNode) {
    return undefined;
  }
  return raw.getContext();
}
