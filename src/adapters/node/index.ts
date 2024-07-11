import type {
  H3,
  EventHandler,
  EventHandlerResponse,
  H3Event,
} from "../../types";
import type { NodeHandler, NodeMiddleware } from "../../types/node";
import { _kRaw } from "../../event";
import { EventWrapper } from "../../event";
import { NodeEvent } from "./_event";
import { sendNodeResponse, callNodeHandler } from "./_utils";
import { errorToH3Response, prepareResponse } from "../../response";

/**
 * Convert H3 app instance to a NodeHandler with (IncomingMessage, ServerResponse) => void signature.
 */
export function toNodeHandler(app: H3): NodeHandler {
  const nodeHandler: NodeHandler = async function (nodeReq, nodeRes) {
    const rawEvent = new NodeEvent(nodeReq, nodeRes);
    const event = new EventWrapper(rawEvent);

    const _res = await app.handler(event).catch((error: unknown) => error);

    if (nodeRes.headersSent || nodeRes.writableEnded) {
      return;
    }

    const resBody = await prepareResponse(event, _res, app.config);

    await sendNodeResponse(nodeRes, resBody).catch((sendError) => {
      // Possible cases: Stream canceled, headers already sent, etc.
      if (nodeRes.headersSent || nodeRes.writableEnded) {
        return;
      }
      const errRes = errorToH3Response(sendError, app.config);
      if (errRes.status) {
        nodeRes.statusCode = errRes.status;
      }
      if (errRes.statusText) {
        nodeRes.statusMessage = errRes.statusText;
      }
      nodeRes.end(errRes.body);
    });
    if (app.config.onAfterResponse) {
      await app.config.onAfterResponse(event, { body: resBody });
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

export function getNodeContext(
  event: H3Event,
): undefined | ReturnType<NodeEvent["getContext"]> {
  const raw = event[_kRaw] as NodeEvent;
  if (!(raw?.constructor as any)?.isNode) {
    return undefined;
  }
  return raw.getContext();
}

export const defineNodeHandler = (handler: NodeHandler) => handler;

export const defineNodeMiddleware = (handler: NodeMiddleware) => handler;
