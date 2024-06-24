import type { HTTPMethod } from "..";
import type { MimeType } from "./mimes";

// --- Request Headers ---

export type RequestHeaderName = keyof RequestHeaders | AnyString;

export type RequestHeaders = HeadersMap<{
  Accept: MimeType | AnyString;
  "Accept-Charset": AnyString;
  "Accept-Encoding":
    | "gzip"
    | "compress"
    | "deflate"
    | "br"
    | "identity"
    | AnyString;
  "Accept-Language": AnyString;
  "Accept-Ch":
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
    | "RTT"
    | AnyString;
  "Access-Control-Allow-Credentials": "true" | "false" | AnyString;
  "Access-Control-Allow-Headers": RequestHeaderName | AnyString;
  "Access-Control-Allow-Methods": HTTPMethod | AnyString;
  "Access-Control-Allow-Origin": "*" | AnyString;
  "Access-Control-Expose-Headers": RequestHeaderName | AnyString;
  "Access-Control-Max-Age": AnyString;
  "Access-Control-Request-Headers": RequestHeaderName | AnyString;
  "Access-Control-Request-Method": HTTPMethod | AnyString;
  Age: AnyString;
  Allow: HTTPMethod | AnyString;
  Authorization: AnyString;
  "Cache-Control":
    | "no-cache"
    | "no-store"
    | "max-age"
    | "must-revalidate"
    | "public"
    | "private"
    | "proxy-revalidate"
    | "s-maxage"
    | "stale-while-revalidate"
    | "stale-if-error"
    | AnyString;
  Connection: "keep-alive" | "close" | "upgrade" | AnyString;
  "Content-Disposition": AnyString;
  "Content-Encoding":
    | "gzip"
    | "compress"
    | "deflate"
    | "br"
    | "identity"
    | AnyString;
  "Content-Language": AnyString;
  "Content-Length": AnyString;
  "Content-Location": AnyString;
  "Content-Range": AnyString;
  "Content-Security-Policy": AnyString;
  "Content-Type": MimeType | AnyString;
  Cookie: AnyString;
  "Critical-CH": AnyString;
  Date: AnyString;
  "Device-Memory": "0.25" | "0.5" | "1" | "2" | "4" | "8" | AnyString;
  Digest: AnyString;
  ETag: AnyString;
  Expect: "100-continue" | AnyString;
  Expires: AnyString;
  Forwarded: AnyString;
  From: AnyString;
  Host: AnyString;
  "If-Match": AnyString;
  "If-Modified-Since": AnyString;
  "If-None-Match": AnyString;
  "If-Range": AnyString;
  "If-Unmodified-Since": AnyString;
  "Keep-Alive": `timeout=${string}, max=${string}` | AnyString;
  "Last-Modified": AnyString;
  Link: AnyString;
  Location: AnyString;
  "Max-Forwards": AnyString;
  Origin: AnyString;
  "Origin-Agent-Cluster": `?1` | `?0` | AnyString;
  "Ping-From": AnyString;
  "Ping-To": AnyString;
  Pragma: AnyString;
  "Proxy-Authenticate": AnyString;
  "Proxy-Authorization": AnyString;
  Range: AnyString;
  Referer: AnyString;
  "Referrer-Policy":
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url"
    | AnyString;
  "Retry-After": AnyString;
  "Save-Data": `on` | `off` | AnyString;
  "Sec-CH-UA": AnyString;
  "Sec-CH-UA-Arch":
    | "x86"
    | "ARM"
    | "[arm64-v8a, armeabi-v7a, armeabi]"
    | AnyString;
  "Sec-CH-UA-Bitness": "64" | "32" | AnyString;
  "Sec-CH-UA-Full-Version-List": AnyString;
  "Sec-CH-UA-Mobile": `?1` | `?0` | AnyString;
  "Sec-CH-UA-Model": AnyString;
  "Sec-CH-UA-Platform":
    | "Android"
    | "Chrome OS"
    | "Chromium OS"
    | "iOS"
    | "Linux"
    | "macOS"
    | "Windows"
    | "Unknown"
    | AnyString;
  "Sec-CH-UA-Platform-Version": AnyString;
  "Sec-CH-UA-Prefers-Color-Scheme": "dark" | "light" | AnyString;
  "Sec-CH-UA-Prefers-Reduced-Motion": "no-preference" | "reduce" | AnyString;
  "Sec-Fetch-Dest":
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
    | "xslt"
    | AnyString;
  "Sec-Fetch-Mode":
    | "cors"
    | "navigate"
    | "no-cors"
    | "same-origin"
    | "websocket"
    | AnyString;
  "Sec-Fetch-Site":
    | "cross-site"
    | "same-origin"
    | "same-site"
    | "none"
    | AnyString;
  "Sec-Fetch-User": "?1" | AnyString;
  "Sec-Purpose": "prefetch" | AnyString;
  "Sec-WebSocket-Accept": AnyString;
  "Sec-WebSocket-Extensions": AnyString;
  "Sec-WebSocket-Key": AnyString;
  "Sec-WebSocket-Protocol": AnyString;
  "Sec-WebSocket-Version": AnyString;
  Server: AnyString;
  "Service-Worker-Allowed": AnyString;
  "Set-Cookie": AnyString;
  "Strict-Transport-Security": AnyString;
  TE: "trailers" | AnyString;
  Trailer: AnyString;
  "Transfer-Encoding":
    | "chunked"
    | "compress"
    | "deflate"
    | "gzip"
    | "identity"
    | AnyString;
  Upgrade: AnyString;
  "Upgrade-Insecure-Requests": "1" | AnyString;
  "User-Agent": AnyString;
  Vary: AnyString;
  Via: AnyString;
  Warning: AnyString;
  "WWW-Authenticate": AnyString;
  "X-Content-Type-Options": "nosniff" | AnyString;
  "X-DNS-Prefetch-Control": "on" | "off" | AnyString;
  "X-Forwarded-For": AnyString;
  "X-Forwarded-Host": AnyString;
  "X-Forwarded-Proto": AnyString;
  "X-Frame-Options": "deny" | "sameorigin" | AnyString;
  "X-Permitted-Cross-Domain-Policies":
    | "none"
    | "master-only"
    | "by-content-type"
    | "all"
    | AnyString;
  "X-Pingback": AnyString;
  "X-Requested-With": AnyString;
  "X-XSS-Protection": "0" | "1" | "1; mode=block" | AnyString;
}>;

// --- Response Headers ---

export type ResponseHeaderName = keyof ResponseHeaders | AnyString;

export type ResponseHeaders = HeadersMap<{
  "Accept-Patch": AnyString;
  "Accept-Ranges": "bytes" | "none" | AnyString;
  "Access-Control-Allow-Credentials": "true" | AnyString;
  "Access-Control-Allow-Headers": "*" | ResponseHeaderName | AnyString;
  "Access-Control-Allow-Methods": "*" | HTTPMethod | AnyString;
  "Access-Control-Allow-Origin": "*" | "null" | AnyString;
  "Access-Control-Expose-Headers": "*" | ResponseHeaderName | AnyString;
  "Access-Control-Max-Age": AnyString;
  Age: AnyString;
  Allow: HTTPMethod | AnyString;
  "Alt-Svc": AnyString;
  "Alt-Used": AnyString;
  "Cache-Control":
    | "no-cache"
    | "no-store"
    | "max-age"
    | "must-revalidate"
    | "public"
    | "private"
    | "proxy-revalidate"
    | "s-maxage"
    | "stale-while-revalidate"
    | "stale-if-error"
    | AnyString;
  "Clear-Site-Data": AnyString;
  Connection: "keep-alive" | "close" | AnyString;
  "Content-Disposition": AnyString;
  "Content-DPR": AnyString;
  "Content-Encoding":
    | "gzip"
    | "compress"
    | "deflate"
    | "br"
    | "identity"
    | AnyString;
  "Content-Language": AnyString;
  "Content-Length": AnyString;
  "Content-Location": AnyString;
  "Content-Range": AnyString;
  "Content-Security-Policy": AnyString;
  "Content-Security-Policy-Report-Only": AnyString;
  "Content-Type": MimeType | AnyString;
  "Cross-Origin-Embedder-Policy":
    | "unsafe-none"
    | "require-corp"
    | "credentialless"
    | AnyString;
  "Cross-Origin-Opener-Policy":
    | "unsafe-none"
    | "same-origin-allow-popups"
    | "same-origin"
    | AnyString;
  "Cross-Origin-Resource-Policy":
    | "same-site"
    | "same-origin"
    | "cross-origin"
    | AnyString;
  Date: AnyString;
  "Device-Memory": AnyString;
  Digest: AnyString;
  Downlink: AnyString;
  ECT: "slow-2g" | "2g" | "3g" | "4g" | AnyString;
  ETag: AnyString;
  "Early-Data": "1" | AnyString;
  "Expect-CT": AnyString;
  Expires: AnyString;
  "Feature-Policy": AnyString;
  "Last-Event-ID": AnyString;
  "Last-Modified": AnyString;
  Link: AnyString;
  Location: AnyString;
  NEL: AnyString;
  "Origin-Agent-Cluster": AnyString;
  "Origin-Isolation": AnyString;
  "Proxy-Authenticate": AnyString;
  "Public-Key-Pins": AnyString;
  "Public-Key-Pins-Report-Only": AnyString;
  Refresh: AnyString;
  "Report-To": AnyString;
  "Retry-After": AnyString;
  "Save-Data": AnyString;
  "Sec-WebSocket-Accept": AnyString;
  "Sec-WebSocket-Extensions": AnyString;
  "Sec-WebSocket-Protocol": AnyString;
  "Sec-WebSocket-Version": AnyString;
  Server: AnyString;
  "Server-Timing": AnyString;
  "Service-Worker-Allowed": AnyString;
  "Service-Worker-Navigation-Preload": AnyString;
  "Set-Cookie": AnyString;
  Signature: AnyString;
  "Signed-Headers": AnyString;
  Sourcemap: AnyString;
  "Strict-Transport-Security": AnyString;
  "Timing-Allow-Origin": AnyString;
  Tk: AnyString;
  Vary: AnyString;
  Via: AnyString;
  "WWW-Authenticate": AnyString;
  "X-Content-Type-Options": "nosniff" | AnyString;
  "X-DNS-Prefetch-Control": "on" | "off" | AnyString;
  "X-Frame-Options": "DENY" | "SAMEORIGIN" | AnyString;
  "X-Permitted-Cross-Domain-Policies":
    | "none"
    | "master-only"
    | "by-content-type"
    | "all"
    | AnyString;
  "X-Powered-By": AnyString;
  "X-Robots-Tag": AnyString;
  "X-UA-Compatible": "IE=edge" | AnyString;
  "X-XSS-Protection": "0" | "1" | "1; mode=block" | AnyString;
}>;

// --- Type Utils ---

type AnyString = string & {};

type HeadersMap<T extends Record<string, string>> = Partial<
  T & {
    [K in keyof T as K extends string ? Lowercase<K> : never]: T[K];
  } & Record<string, string>
>;
