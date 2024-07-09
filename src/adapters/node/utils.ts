import type {
  App,
  EventHandler,
  EventHandlerResponse,
  H3Event,
} from "../../types";
import type {
  NodeHandler,
  NodeIncomingMessage,
  NodeMiddleware,
  NodeServerResponse,
} from "../../types/node";
import { _kRaw } from "../../event";
import { isEventHandler } from "../../handler";
import { EventWrapper } from "../../event";
import { NodeEvent } from "./event";
import { _sendResponse, callNodeHandler } from "./_internal";
import { errorToAppResponse } from "../../response";

/**
 * Convert H3 app instance to a NodeHandler with (IncomingMessage, ServerResponse) => void signature.
 */
export function toNodeHandler(app: App): NodeHandler {
  const nodeHandler: NodeHandler = async function (req, res) {
    const rawEvent = new NodeEvent(req, res);
    const event = new EventWrapper(rawEvent);
    const appResponse = await app.handler(event);
    await _sendResponse(res, appResponse).catch((sendError) => {
      // Possible cases: Stream canceled, headers already sent, etc.
      if (res.headersSent || res.writableEnded) {
        return;
      }
      const errRes = errorToAppResponse(sendError, app.config);
      if (errRes.status) {
        res.statusCode = errRes.status;
      }
      if (errRes.statusText) {
        res.statusMessage = errRes.statusText;
      }
      res.end(errRes.body);
    });
    if (app.config.onAfterResponse) {
      await app.config.onAfterResponse(event, { body: appResponse });
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
  return (event) => {
    const nodeCtx = getNodeContext(event);
    if (!nodeCtx) {
      throw new Error(
        "[h3] Executing Node.js middleware is not supported in this server!",
      );
    }
    return callNodeHandler(
      handler,
      nodeCtx.req,
      nodeCtx.res,
    ) as EventHandlerResponse;
  };
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
