import { EventHandler } from "../types";
import { eventHandler, type H3Event } from "../event";
import { getRequestHeaders } from "./request";
import { setResponseHeader, setResponseStatus } from "./response";

const authenticationFailed = (event: H3Event) => {
  setResponseHeader(
    event,
    "WWW-Authenticate",
    'Basic realm="Authentication required"',
  );
  setResponseStatus(event, 401);
  return "Authentication required";
};

/**
 * Protect an event handler with basic authentication
 *
 * @example
 * export default withBasicAuth({ username: 'test', password: 'abc123!' }, defineEventHandler(async (event) => {
 *   return 'Hello, world!';
 * }));
 *
 * @param auth The username and password to use for authentication.
 * @param handler The event handler to wrap.
 */
export function withBasicAuth(
  auth: { username: string; password: string } | string,
  handler: EventHandler,
): EventHandler {
  const authString =
    typeof auth === "string" ? auth : `${auth.username}:${auth.password}`;
  return eventHandler(async (event) => {
    const headers = getRequestHeaders(event);

    if (!headers.authorization) {
      return authenticationFailed(event);
    }

    const b64auth = headers.authorization.split(" ")[1] || "";
    const decodedAuthHeader = Buffer.from(b64auth, "base64").toString();

    if (decodedAuthHeader !== authString) {
      return authenticationFailed(event);
    }

    return await handler(event);
  });
}
