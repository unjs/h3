import type { H3, EventHandler, EventHandlerResponse } from "../../types";
import type { NodeHandler, NodeMiddleware } from "../../types/node";
import { NodeEvent } from "./event";
import { sendNodeResponse, callNodeHandler } from "./internal/utils";
import { prepareResponse, prepareErrorResponseBody } from "../../response";
import { createError } from "../../error";

export { kNodeReq, kNodeRes } from "./internal/utils";

/**
 * Convert H3 app instance to a NodeHandler with (IncomingMessage, ServerResponse) => void signature.
 */
export function toNodeHandler(app: H3): NodeHandler {
  const nodeHandler: NodeHandler = async function (nodeReq, nodeRes) {
    // Create a new event instance
    const event = new NodeEvent(nodeReq, nodeRes);

    // Execute the handler
    let handlerRes: unknown | Promise<unknown>;
    try {
      handlerRes = app._handler(event);
    } catch (error: any) {
      handlerRes = Promise.reject(error);
    }

    // Handle the response
    return Promise.resolve(handlerRes)
      .catch((error) => {
        const h3Error = createError(error);
        return app.config.onError
          ? Promise.resolve(app.config.onError(h3Error, event)).then(
              (_res) => _res ?? h3Error,
            )
          : h3Error;
      })
      .then((resolvedRes) => {
        const preparedRes = prepareResponse(resolvedRes, event, app.config);
        let promise = app.config.onBeforeResponse
          ? Promise.resolve(
              app.config.onBeforeResponse(event, preparedRes),
            ).then(() => sendNodeResponse(nodeRes, preparedRes.body))
          : sendNodeResponse(nodeRes, preparedRes.body);
        if (app.config.onAfterResponse) {
          promise = promise.then(() =>
            app.config.onAfterResponse!(event, preparedRes),
          );
        }
        return promise;
      })
      .catch((error) => {
        // Possible cases: Stream canceled, headers already sent, etc.
        if (nodeRes.headersSent || nodeRes.writableEnded) {
          return;
        }
        nodeRes.end(prepareErrorResponseBody(error, event, app.config));
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
