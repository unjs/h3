import type { H3Event } from "../event";
import type { RequestHeaders } from "../http";

export type Duplex = "half" | "full";

export interface ProxyOptions {
  headers?: RequestHeaders | HeadersInit;
  fetchOptions?: RequestInit & { duplex?: Duplex } & {
    ignoreResponseError?: boolean;
  };
  fetch?: typeof fetch;
  sendStream?: boolean;
  streamRequest?: boolean;
  cookieDomainRewrite?: string | Record<string, string>;
  cookiePathRewrite?: string | Record<string, string>;
  onResponse?: (event: H3Event, response: Response) => void;
}
