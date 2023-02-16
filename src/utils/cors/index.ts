export { handleCors } from "./handler";
export {
  isPreflightRequest,
  isCorsOriginAllowed,
  appendCorsActualRequestHeaders,
  appendCorsPreflightHeaders,
} from "./utils";

export type { H3CorsOptions } from "./types";
