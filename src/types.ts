import type { QueryObject } from "ufo";
import type { H3Event } from "./event";
import type { Session } from "./utils/session";
import type { RouteNode } from "./router";

export type {
  ValidateFunction,
  ValidateResult,
} from "./utils/internal/validate";

// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
export type HTTPMethod =
  | "GET"
  | "HEAD"
  | "PATCH"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE";

export type Encoding =
  | false
  | "ascii"
  | "utf8"
  | "utf-8" // eslint-disable-line unicorn/text-encoding-identifier-case
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "latin1"
  | "binary"
  | "hex";

export interface H3EventContext extends Record<string, any> {
  /* Matched router parameters */
  params?: Record<string, string>;
  /**
   * Matched router Node
   *
   * @experimental The object structure may change in non-major version.
   */
  matchedRoute?: RouteNode;
  /* Cached session data */
  sessions?: Record<string, Session>;
  /* Trusted IP Address of client */
  clientAddress?: string;
}

export type EventHandlerResponse<T = any> = T | Promise<T>;

export interface EventHandlerRequest {
  // TODO: Default to unknown in next major version
  body?: any;

  query?: QueryObject;
}

export type InferEventInput<
  Key extends keyof EventHandlerRequest,
  Event extends H3Event,
  T,
> = void extends T ? (Event extends H3Event<infer E> ? E[Key] : never) : T;

export interface EventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> {
  __is_handler__?: true;
  (event: H3Event<Request>): Response;
}

export type _RequestMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
> = (event: H3Event<Request>) => void | Promise<void>;

export type _ResponseMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> = (
  event: H3Event<Request>,
  response: { body?: Awaited<Response> },
) => void | Promise<void>;

export type EventHandlerObject<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> = {
  onRequest?: _RequestMiddleware<Request> | _RequestMiddleware<Request>[];
  onBeforeResponse?:
    | _ResponseMiddleware<Request, Response>
    | _ResponseMiddleware<Request, Response>[];
  handler: EventHandler<Request, Response>;
};

export type LazyEventHandler = () => EventHandler | Promise<EventHandler>;

export type RequestHeaders = Partial<
  Record<HTTPHeaderName, string | undefined>
>;

// prettier-ignore
type _HTTPHeaderName = "WWW-Authenticate" | "Authorization" | "Proxy-Authenticate" | "Proxy-Authorization" | "Age" | "Cache-Control" | "Clear-Site-Data" | "Expires" | "Pragma" | "Accept-CH" | "Critical-CH" | "Sec-CH-UA" | "Sec-CH-UA-Arch" | "Sec-CH-UA-Bitness" | "Sec-CH-UA-Full-Version-List" | "Sec-CH-UA-Mobile" | "Sec-CH-UA-Model" | "Sec-CH-UA-Platform" | "Sec-CH-UA-Platform-Version" | "Sec-CH-UA-Prefers-Color-Scheme" | "Sec-CH-UA-Prefers-Reduced-Motion" | "Downlink" | "ECT" | "RTT" | "Save-Data" | "Last-Modified" | "ETag" | "If-Match" | "If-None-Match" | "If-Modified-Since" | "If-Unmodified-Since" | "Vary" | "Connection" | "Keep-Alive" | "Accept" | "Accept-Encoding" | "Accept-Language" | "Expect" | "Max-Forwards" | "Cookie" | "Set-Cookie" | "Access-Control-Allow-Origin" | "Access-Control-Allow-Credentials" | "Access-Control-Allow-Headers" | "Access-Control-Allow-Methods" | "Access-Control-Expose-Headers" | "Access-Control-Max-Age" | "Access-Control-Request-Headers" | "Access-Control-Request-Method" | "Origin" | "Timing-Allow-Origin" | "Content-Disposition" | "Content-Length" | "Content-Type" | "Content-Encoding" | "Content-Language" | "Content-Location" | "Forwarded" | "X-Forwarded-For" | "X-Forwarded-Host" | "X-Forwarded-Proto" | "Via" | "Location" | "Refresh" | "From" | "Host" | "Referer" | "Referrer-Policy" | "User-Agent" | "Allow" | "Server" | "Accept-Ranges" | "Range" | "If-Range" | "Content-Range" | "Cross-Origin-Embedder-Policy" | "Cross-Origin-Opener-Policy" | "Cross-Origin-Resource-Policy" | "Content-Security-Policy" | "Content-Security-Policy-Report-Only" | "Expect-CT" | "Origin-Isolation" | "Permissions-Policy" | "Strict-Transport-Security" | "Upgrade-Insecure-Requests" | "X-Content-Type-Options" | "X-Frame-Options" | "X-Permitted-Cross-Domain-Policies" | "X-Powered-By" | "X-XSS-Protection" | "Sec-Fetch-Site" | "Sec-Fetch-Mode" | "Sec-Fetch-User" | "Sec-Fetch-Dest" | "Sec-Purpose" | "Service-Worker-Navigation-Preload" | "Last-Event-ID" | "NEL" | "Ping-From" | "Ping-To" | "Report-To" | "Transfer-Encoding" | "TE" | "Trailer" | "Sec-WebSocket-Key" | "Sec-WebSocket-Extensions" | "Sec-WebSocket-Accept" | "Sec-WebSocket-Protocol" | "Sec-WebSocket-Version" | "Accept-Push-Policy" | "Accept-Signature" | "Alt-Svc" | "Alt-Used" | "Date" | "Early-Data" | "Link" | "Push-Policy" | "Retry-After" | "Signature" | "Signed-Headers" | "Server-Timing" | "Service-Worker-Allowed" | "SourceMap" | "Upgrade" | "X-DNS-Prefetch-Control" | "X-Pingback" | "X-Requested-With" | "X-Robots-Tag";

export type HTTPHeaderName =
  | _HTTPHeaderName
  | Lowercase<_HTTPHeaderName>
  | (string & {}); // eslint-disable-line @typescript-eslint/ban-types
