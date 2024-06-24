import type { NodeHandler, NodeMiddleware } from "../../types/node";

export {
  fromNodeHandler,
  toNodeHandler,
  fromNodeRequest,
  getNodeContext,
  callNodeHandler,
} from "./utils";

export type {
  NodeHandler,
  NodeMiddleware,
  NodeIncomingMessage,
  NodeServerResponse,
} from "../../types/node";

export const defineNodeHandler = (handler: NodeHandler) => handler;
export const defineNodeMiddleware = (handler: NodeMiddleware) => handler;
