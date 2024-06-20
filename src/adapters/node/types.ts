import type {
  IncomingMessage as NodeIncomingMessage,
  ServerResponse as NodeServerResponse,
} from "node:http";

export type {
  IncomingMessage as NodeIncomingMessage,
  ServerResponse as NodeServerResponse,
} from "node:http";

export type NodeHandler = (
  req: NodeIncomingMessage,
  res: NodeServerResponse,
) => void;

export type NodeMiddleware = (
  req: NodeIncomingMessage,
  res: NodeServerResponse,
  next: (err?: Error) => any,
) => any;

export const defineNodeHandler = (handler: NodeHandler) => handler;

export const defineNodeMiddleware = (middleware: NodeMiddleware) => middleware;
