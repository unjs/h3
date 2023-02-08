export { handleCors } from "./handler";
export {
  isPreflightRequest,
  isCorsAllowedOrigin,
  appendCorsActualRequestHeaders,
  appendCorsPreflightHeaders,
} from "./utils";
export type { CorsOptions } from "./types";
