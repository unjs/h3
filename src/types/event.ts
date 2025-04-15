import type { EventHandlerRequest, H3EventContext } from ".";
import type { ServerRequest } from "srvx/types";

export interface H3Event<
  _RequestT extends EventHandlerRequest = EventHandlerRequest,
> {
  /**
   * Event context.
   */
  readonly context: H3EventContext;

  /**
   * Incoming HTTP request info.
   *
   * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Request)
   */
  readonly req: ServerRequest;

  /**
   * Access to the parsed request URL.
   *
   * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/URL)
   */
  readonly url: URL;

  /**
   * Prepared HTTP response.
   */
  readonly res: {
    status?: number;
    statusText?: string;
    readonly headers: Headers;
  };

  /**
   * Access to the raw Node.js req/res objects.
   *
   * @deprecated Use `event.req.{node|deno|bun|...}.` instead.
   */
  node?: ServerRequest["node"];

  /**
   * Access to the incoming request url (pathname+search).
   *
   * @deprecated Use `event.url` instead.
   *
   * Example: `/api/hello?name=world`
   * */
  readonly path: string;

  /**
   * Access to the incoming request method.
   *
   * @deprecated Use `event.req.method` instead.
   */
  readonly method: string;

  /**
   * Access to the incoming request headers.
   *
   * @deprecated Use `event.req.headers` instead.
   *
   * */
  readonly headers: Headers;
}
