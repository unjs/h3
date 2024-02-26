import type { QueryObject } from "ufo";
import type { Hooks as WSHooks } from "crossws";
import type { H3Event } from "./event";
import type { Session } from "./utils/session";
import type { RouteNode } from "./router";
import type { MIMETypes } from "./types.mimes";

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

type _status =
  | 100
  | 101
  | 102
  | 103
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 208
  | 226
  | 300
  | 301
  | 302
  | 303
  | 304
  | 305
  | 307
  | 308
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 420
  | 421
  | 422
  | 423
  | 424
  | 425
  | 426
  | 428
  | 429
  | 431
  | 444
  | 450
  | 451
  | 497
  | 498
  | 499
  | 500
  | 501
  | 502
  | 503
  | 504
  | 506
  | 507
  | 508
  | 509
  | 510
  | 511
  | 521
  | 522
  | 523
  | 525
  | 530
  | 599;

export type Status = _status | `${_status}`;

export type Compression = "gzip" | "compress" | "deflate" | "br" | "identity";

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
  body?: any; // TODO: Default to unknown in next major version
  query?: QueryObject;
  routerParams?: Record<string, string>;
}

export type InferEventInput<
  Key extends keyof EventHandlerRequest,
  Event extends H3Event,
  T,
> = void extends T ? (Event extends H3Event<infer E> ? E[Key] : never) : T;

type MaybePromise<T> = T | Promise<T>;

export type EventHandlerResolver = (
  path: string,
) => MaybePromise<undefined | { route?: string; handler: EventHandler }>;

export interface EventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> {
  __is_handler__?: true;
  __resolve__?: EventHandlerResolver;
  __websocket__?: Partial<WSHooks>;
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
  /** @experimental */
  websocket?: Partial<WSHooks>;
  handler: EventHandler<Request, Response>;
};

export type LazyEventHandler = () => EventHandler | Promise<EventHandler>;

export type RequestHeaders = Partial<
  Record<HTTPHeaderName, string | undefined>
>;

// prettier-ignore
type _HTTPHeaderName = "WWW-Authenticate" | "Authorization" | "Proxy-Authenticate" | "Proxy-Authorization" | "Age" | "Cache-Control" | "Clear-Site-Data" | "Expires" | "Pragma" | "Accept-CH" | "Critical-CH" | "Sec-CH-UA" | "Sec-CH-UA-Arch" | "Sec-CH-UA-Bitness" | "Sec-CH-UA-Full-Version-List" | "Sec-CH-UA-Mobile" | "Sec-CH-UA-Model" | "Sec-CH-UA-Platform" | "Sec-CH-UA-Platform-Version" | "Sec-CH-UA-Prefers-Color-Scheme" | "Sec-CH-UA-Prefers-Reduced-Motion" | "Downlink" | "ECT" | "RTT" | "Save-Data" | "Last-Modified" | "ETag" | "If-Match" | "If-None-Match" | "If-Modified-Since" | "If-Unmodified-Since" | "Vary" | "Connection" | "Keep-Alive" | "Accept" | "Accept-Encoding" | "Accept-Language" | "Expect" | "Max-Forwards" | "Cookie" | "Set-Cookie" | "Access-Control-Allow-Origin" | "Access-Control-Allow-Credentials" | "Access-Control-Allow-Headers" | "Access-Control-Allow-Methods" | "Access-Control-Expose-Headers" | "Access-Control-Max-Age" | "Access-Control-Request-Headers" | "Access-Control-Request-Method" | "Origin" | "Timing-Allow-Origin" | "Content-Disposition" | "Content-Length" | "Content-Type" | "Content-Encoding" | "Content-Language" | "Content-Location" | "Forwarded" | "X-Forwarded-For" | "X-Forwarded-Host" | "X-Forwarded-Proto" | "Via" | "Location" | "Refresh" | "From" | "Host" | "Referer" | "Referrer-Policy" | "User-Agent" | "Allow" | "Server" | "Accept-Ranges" | "Range" | "If-Range" | "Content-Range" | "Cross-Origin-Embedder-Policy" | "Cross-Origin-Opener-Policy" | "Cross-Origin-Resource-Policy" | "Content-Security-Policy" | "Content-Security-Policy-Report-Only" | "Expect-CT" | "Origin-Isolation" | "Permissions-Policy" | "Strict-Transport-Security" | "Upgrade-Insecure-Requests" | "X-Content-Type-Options" | "X-Frame-Options" | "X-Permitted-Cross-Domain-Policies" | "X-Powered-By" | "X-XSS-Protection" | "Sec-Fetch-Site" | "Sec-Fetch-Mode" | "Sec-Fetch-User" | "Sec-Fetch-Dest" | "Sec-Purpose" | "Service-Worker-Navigation-Preload" | "Last-Event-ID" | "NEL" | "Ping-From" | "Ping-To" | "Report-To" | "Transfer-Encoding" | "TE" | "Trailer" | "Sec-WebSocket-Key" | "Sec-WebSocket-Extensions" | "Sec-WebSocket-Accept" | "Sec-WebSocket-Protocol" | "Sec-WebSocket-Version" | "Accept-Push-Policy" | "Accept-Signature" | "Alt-Svc" | "Alt-Used" | "Date" | "Early-Data" | "Link" | "Push-Policy" | "Retry-After" | "Signature" | "Signed-Headers" | "Server-Timing" | "Service-Worker-Allowed" | "SourceMap" | "Upgrade" | "X-DNS-Prefetch-Control" | "X-Pingback" | "X-Requested-With" | "X-Robots-Tag";

export type NodeHeaderValue = string | number | readonly string[];

export type HTTPHeaderName =
  | _HTTPHeaderName
  | Lowercase<_HTTPHeaderName>
  | (string & {}); // eslint-disable-line @typescript-eslint/ban-types

export type EmailAddress = `${string}@${string}.${string}`;
export type CH =
  | "Sec-CH-UA"
  | "Sec-CH-UA-Arch"
  | "Sec-CH-UA-Bitness"
  | "Sec-CH-UA-Full-Version-List"
  | "Sec-CH-UA-Full-Version"
  | "Sec-CH-UA-Mobile"
  | "Sec-CH-UA-Model"
  | "Sec-CH-UA-Platform"
  | "Sec-CH-UA-Platform-Version"
  | "Sec-CH-Prefers-Reduced-Motion"
  | "Sec-CH-Prefers-Color-Scheme"
  | "Device-Memory"
  | "Width"
  | "Viewport-Width"
  | "Save-Data"
  | "Downlink"
  | "ECT"
  | "RTT";
export type HostType = `${string}.${string}`;
export type PortHostType = HostType | `${HostType}:${number}`;
export type OriginType = `http${string}://${PortHostType}`;
export type URLType = `/${string}` | OriginType;
export type HeaderPref = "no-preference" | "reduce";
export type HeaderBoolean = `?1` | `?0`;
export type HeaderValues = {
  accept: MIMETypes[];
  "accept-ch": CH[];
  "accept-ranges": "bytes" | "none";
  "access-control-allow-credentials": true | never;
  "access-control-allow-headers": "*" | HTTPHeaderName[];
  "access-control-allow-methods": "*" | HTTPMethod[];
  "access-control-allow-origin": "*" | "null" | OriginType;
  "access-control-expose-headers": "*" | HTTPHeaderName[];
  "access-control-request-headers": HTTPHeaderName[];
  "access-control-request-method": HTTPMethod;
  "access-control-max-age": number;
  "alt-used": HostType;
  "content-type": MIMETypes;
  connection: "keep-alive" | "close" | "upgrade";
  "content-length": number;
  "content-location": URLType;
  "cross-origin-embedder-policy":
    | "unsafe-none"
    | "require-corp"
    | "credentialless";
  "cross-origin-opener-policy":
    | "unsafe-none"
    | "same-origin-allow-popups"
    | "same-origin";
  "cross-origin-resource-policy": "same-site" | "same-origin" | "cross-origin";
  downlink: number;
  "early-data": 1;
  ect: "slow-2g" | "2g" | "3g" | "4g";
  expect: "100-continue";
  from: EmailAddress;
  host: PortHostType;
  "keep-alive": `timeout=${number}, max=${number}`;
  referrer: URLType;
  "referrer-policy":
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";
  age: number;
  location: URLType;
  "max-forwards": number;
  origin: `null` | URLType;
  "origin-agent-cluster": HeaderBoolean;
  "device-memory": 0.25 | 0.5 | 1 | 2 | 4 | 8;
  "retry-after": number;
  rtt: number;
  "save-data": `on` | `off`;
  "sec-ch-prefers-color-scheme": "dark" | "light";
  "sec-ch-prefers-reduced-motion": HeaderPref;
  "sec-ch-prefers-reduced-transparency": HeaderPref;
  "sec-ch-ua-arch": "x86" | "ARM" | "[arm64-v8a, armeabi-v7a, armeabi]";
  "sec-ch-ua-bitness": "64" | "32";
  "sec-ch-ua-mobile": HeaderBoolean;
  "sec-ch-ua-platform":
    | "Android"
    | "Chrome OS"
    | "Chromium OS"
    | "iOS"
    | "Linux"
    | "macOS"
    | "Windows"
    | "Unknown";
  "sec-fetch-dest":
    | "audio"
    | "audioworklet"
    | "document"
    | "embed"
    | "empty"
    | "font"
    | "frame"
    | "iframe"
    | "image"
    | "manifest"
    | "object"
    | "paintworklet"
    | "report"
    | "script"
    | "serviceworker"
    | "sharedworker"
    | "style"
    | "track"
    | "video"
    | "worker"
    | "xslt";
  "sec-fetch-mode":
    | "cors"
    | "navigate"
    | "no-cors"
    | "same-origin"
    | "websocket";
  "sec-fetch-site": "cross-site" | "same-origin" | "same-site" | "none";
  "sec-fetch-user": "?1" | never;
  "sec-purpose": "prefetch";
  sourcemap: URLType;
  "upgrade-insecure-requests": 1;
  "x-content-type-options": "nosniff";
  "x-dns-prefetch-control": "on" | "off";
  "x-frame-options": "DENY" | "SAMEORIGIN";
  [x: string]: unknown;
};
