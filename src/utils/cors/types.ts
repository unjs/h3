import { HTTPMethod } from "../../types";

export interface H3CorsOptions {
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
      "Access-Control-Allow-Origin": "*";
    }
  | {
      "Access-Control-Allow-Origin": "null" | string;
      Vary: "Origin";
    }
  | H3EmptyHeader;

export type H3AccessControlAllowMethodsHeader =
  | {
      "Access-Control-Allow-Methods": "*" | string;
    }
  | H3EmptyHeader;

export type H3AccessControlAllowCredentialsHeader =
  | {
      "Access-Control-Allow-Credentials": "true";
    }
  | H3EmptyHeader;

export type H3AccessControlAllowHeadersHeader =
  | {
      "Access-Control-Allow-Headers": "*" | string;
      Vary: "Access-Control-Request-Headers";
    }
  | H3EmptyHeader;

export type H3AccessControlExposeHeadersHeader =
  | {
      "Access-Control-Expose-Headers": "*" | string;
    }
  | H3EmptyHeader;

export type H3AccessControlMaxAgeHeader =
  | {
      "Access-Control-Max-Age": string;
    }
  | H3EmptyHeader;

export type H3CorsHeaders =
  | H3AccessControlAllowOriginHeader
  | H3AccessControlAllowMethodsHeader
  | H3AccessControlAllowCredentialsHeader
  | H3AccessControlAllowHeadersHeader
  | H3AccessControlExposeHeadersHeader
  | H3AccessControlMaxAgeHeader;
