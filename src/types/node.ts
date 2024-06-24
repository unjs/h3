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
) => unknown | Promise<unknown>;

export type NodeMiddleware = (
  req: NodeIncomingMessage,
  res: NodeServerResponse,
  next: (error?: Error) => void,
) => unknown | Promise<unknown>;

export type { NodeEvent } from "../adapters/node/event";
