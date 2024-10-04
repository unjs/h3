import type { HTTPMethod } from "..";

export interface H3CorsOptions {
  /**
   * This determines the value of the "access-control-allow-origin" response header.
   * The wildcard characters "*" can be used to allow all origins.
   * An array of strings or regular expressions can be used with origin matching.
   * And a custom function to validate the origin. It takes the origin as an argument and returns `true` if allowed.
   * 
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
   */
  origin?: "*" | "null" | (string | RegExp)[] | ((origin: string) => boolean);
  methods?: "*" | HTTPMethod[];
  allowHeaders?: "*" | string[];
  exposeHeaders?: "*" | string[];
  credentials?: boolean;
  maxAge?: string | false;
  preflight?: {
    statusCode?: number;
  };
}

// TODO: Define `ResolvedCorsOptions` as "deep required nonnullable" type of `CorsOptions`
export interface H3ResolvedCorsOptions {
  origin: "*" | "null" | (string | RegExp)[] | ((origin: string) => boolean);
  methods: "*" | HTTPMethod[];
  allowHeaders: "*" | string[];
  exposeHeaders: "*" | string[];
  credentials: boolean;
  maxAge: string | false;
  preflight: {
    statusCode: number;
  };
}

export type H3EmptyHeader = Record<string, never>;

export type H3AccessControlAllowOriginHeader =
  | {
      "access-control-allow-origin": "*";
    }
  | {
      "access-control-allow-origin": "null" | string;
      vary: "origin";
    }
  | H3EmptyHeader;

export type H3AccessControlAllowMethodsHeader =
  | {
      "access-control-allow-methods": "*" | string;
    }
  | H3EmptyHeader;

export type H3AccessControlAllowCredentialsHeader =
  | {
      "access-control-allow-credentials": "true";
    }
  | H3EmptyHeader;

export type H3AccessControlAllowHeadersHeader =
  | {
      "access-control-allow-headers": "*" | string;
      vary: "access-control-request-headers";
    }
  | H3EmptyHeader;

export type H3AccessControlExposeHeadersHeader =
  | {
      "access-control-expose-headers": "*" | string;
    }
  | H3EmptyHeader;

export type H3AccessControlMaxAgeHeader =
  | {
      "access-control-max-age": string;
    }
  | H3EmptyHeader;

export type H3CorsHeaders =
  | H3AccessControlAllowOriginHeader
  | H3AccessControlAllowMethodsHeader
  | H3AccessControlAllowCredentialsHeader
  | H3AccessControlAllowHeadersHeader
  | H3AccessControlExposeHeadersHeader
  | H3AccessControlMaxAgeHeader;
