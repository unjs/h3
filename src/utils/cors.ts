export {
  defineCorsEventHandler as handleCors,
  isPreflight,
  isAllowedOrigin,
  appendCorsActualRequestHeaders,
  appendCorsPreflightHeaders,
} from "@nozomuikuta/h3-cors";

export type {
  CorsOptions,
  ResolvedCorsOptions,
  EmptyHeader,
  AccessControlAllowOriginHeader,
  AccessControlAllowMethodsHeader,
  AccessControlAllowCredentialsHeader,
  AccessControlAllowHeadersHeader,
  AccessControlExposeHeadersHeader,
  AccessControlMaxAgeHeader,
  CorsHeaders,
} from "@nozomuikuta/h3-cors";
