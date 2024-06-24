import type { H3EventContext } from "./context";

export type WebHandler = (
  request: Request,
  context?: H3EventContext,
) => Promise<Response>;

export type PlainHandler = (
  request: PlainRequest,
  context?: H3EventContext,
) => Promise<PlainResponse>;

export interface PlainRequest {
  path: string;
  method: string;
  headers: HeadersInit;
  body?: BodyInit;
}

export interface PlainResponse {
  status: number;
  statusText: string | undefined;
  headers: Record<string, string>;
  setCookie: string[];
  body?: unknown;
}
