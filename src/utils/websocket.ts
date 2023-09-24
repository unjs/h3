import { NodeIncomingMessage, NodeServerResponse } from "../adapters";
import { H3Event } from "../event";

export class WebSocketUpgradeResponse {
  status: number;
  headers: Headers;
  constructor(_status = 101, _headers: Headers = new Headers()) {
    this.status = _status;
    this.headers = _headers;
  }
}

export function isWebSocketUpgradeRequest(event: H3Event): boolean {
  return event.headers.get("upgrade") === "websocket";
}

export function isWebSocketUpgradeResponse(
  response: any,
): response is WebSocketUpgradeResponse {
  return response instanceof WebSocketUpgradeResponse;
}

/** A WebSocket connected to the Party */
export type Connection = WebSocket & {
  /** Connection identifier */
  // id: string;
  // We would have been able to use Websocket::url
  // but it's not available in the Workers runtime
  // (rather, url is `null` when using WebSocketPair)
  // It's also set as readonly, so we can't set it ourselves.
  // Instead, we'll use the `uri` property.
  // uri: string;
};

export type WebSocketEvent =
  | {
      type: "connection";
      connection: Connection;
    }
  | {
      type: "message";
      message: string | ArrayBuffer | Buffer[];
      connection: Connection;
    }
  | {
      type: "error";
      error: Error;
      connection: Connection;
    }
  | {
      type: "close";
      connection: Connection;
    };

export class H3WebSocketEvent extends H3Event {
  websocket: WebSocketEvent;
  constructor(
    req: NodeIncomingMessage,
    res: NodeServerResponse,
    wsEvent: WebSocketEvent,
  ) {
    super(req, res);
    this.websocket = wsEvent;
  }
}

export function upgradeWebSocket(event: H3Event): WebSocketUpgradeResponse {
  return new WebSocketUpgradeResponse();
}

export function isWebSocketEvent(event: H3Event): event is H3WebSocketEvent {
  // @ts-ignore
  return !!event.websocket;
}

export function toWebSocketEvent(event: H3Event): WebSocketEvent {
  // @ts-ignore
  return event.websocket;
}
