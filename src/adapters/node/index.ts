import type { H3, EventHandler, EventHandlerResponse } from "../../types";
import type { NodeHandler, NodeMiddleware } from "../../types/node";
import { NodeEvent } from "./event";
import { sendNodeResponse, callNodeHandler } from "./internal/utils";
import { prepareResponse, errorToRes } from "../../response";

export { kNodeReq, kNodeRes } from "./internal/utils";

/**
 * Convert H3 app instance to a NodeHandler with (IncomingMessage, ServerResponse) => void signature.
 */
export function toNodeHandler(app: H3): NodeHandler {
  const nodeHandler: NodeHandler = async function (nodeReq, nodeRes) {
    const event = new NodeEvent(nodeReq, nodeRes);

    let _handlerRes: unknown | Promise<unknown>;
    try {
      _handlerRes = app._handler(event);
    } catch (error: any) {
      _handlerRes = error;
    }

    const _body =
      _handlerRes instanceof Promise
        ? _handlerRes
            .catch((error) => error)
            .then((_resolvedRes) =>
              prepareResponse(event, _resolvedRes, app.config),
            )
        : prepareResponse(event, _handlerRes, app.config);

    return Promise.resolve(_body)
      .then((body) => {
        const _chain = sendNodeResponse(nodeRes, body);
        return app.config.onAfterResponse
          ? Promise.resolve(_chain).then(() =>
              app.config.onAfterResponse!(event, { body }),
            )
          : _chain;
      })
      .catch((error) => {
        // Possible cases: Stream canceled, headers already sent, etc.
        if (nodeRes.headersSent || nodeRes.writableEnded) {
          return;
        }
        const errRes = errorToRes(error, app.config);
        if (errRes.status) {
          nodeRes.statusCode = errRes.status;
        }
        if (errRes.statusText) {
          nodeRes.statusMessage = errRes.statusText;
        }
        nodeRes.end(errRes.body);
      });
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
    if (!event.node) {
      throw new Error(
        "[h3] Executing Node.js middleware is not supported in this server!",
      );
    }
    return callNodeHandler(
      handler,
      event.node.req,
      event.node.res,
    ) as EventHandlerResponse;
  };
}

export function defineNodeHandler(handler: NodeHandler) {
  return handler;
}

export function defineNodeMiddleware(handler: NodeMiddleware) {
  return handler;
}
