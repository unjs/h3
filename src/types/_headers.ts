import type { HTTPMethod, HTTPHeaderName } from ".";
import type { ContentType } from "./_mimes";

// prettier-ignore
export type StatusCode = 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 444 | 450 | 451 | 497 | 498 | 499 | 500 | 501 | 502 | 503 | 504 | 506 | 507 | 508 | 509 | 510 | 511 | 521 | 522 | 523 | 525 | 530 | 599 | (number & {}); // eslint-disable-line @typescript-eslint/ban-types

export type Compression = "gzip" | "compress" | "deflate" | "br" | "identity";

export type NodeHeaderValue = string | number | readonly string[];

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

export type HeaderPref = "no-preference" | "reduce";

export type HeaderBoolean = `?1` | `?0`;

type AnyType = string & {}; // eslint-disable-line @typescript-eslint/ban-types

export type TypedHeaders = {
  accept: ContentType[] | `${ContentType};q=${number}`[] | AnyType;
  "accept-ch": CH[] | AnyType;
  "accept-ranges": "bytes" | "none";
  "access-control-allow-credentials": true | never;
  "access-control-allow-headers": "*" | (HTTPHeaderName[] | AnyType);
  "access-control-allow-methods": "*" | (HTTPMethod[] | AnyType);
  "access-control-allow-origin": "*" | "null" | OriginType;
  "access-control-expose-headers": "*" | (HTTPHeaderName[] | AnyType);
  "access-control-request-headers": HTTPHeaderName[] | AnyType;
  "access-control-request-method": HTTPMethod;
  "access-control-max-age": number;
  "alt-used": HostType;
  "content-type": ContentType;
  connection: "keep-alive" | "close" | "upgrade";
  "content-length": number;
  "content-location": string;
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
  referrer: string;
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
  location: string;
  "max-forwards": number;
  origin: `null` | string;
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
  sourcemap: string;
  "upgrade-insecure-requests": 1;
  "x-content-type-options": "nosniff";
  "x-dns-prefetch-control": "on" | "off";
  "x-frame-options": "DENY" | "SAMEORIGIN";
  [x: string]: unknown;
};
