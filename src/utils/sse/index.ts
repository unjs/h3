import type { H3Event } from "../../event";
import { sendStream, setResponseStatus } from "../response";
import { EventStream } from "./event-stream";
import { EventStreamOptions } from "./types";
import { setEventStreamHeaders } from "./utils";

/**
 * Initialize an EventStream instance for creating [server sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
 *
 * @experimental This function is experimental and might be unstable in some environments.
 *
 * @example
 *
 * ```ts
 * import { createEventStream, sendEventStream } from "h3";
 *
 * const eventStream = createEventStream(event);
 *
 * // send messages
 * const interval = setInterval(async () => {
 *   eventStream.push({data: "hello world"});
 * }, 1000);
 *
 * // handle cleanup upon client disconnect
 * eventStream.on("disconnect", () => {
 *   clearInterval(interval);
 * });
 *
 * // send the stream to the client
 * sendEventStream(event, eventStream);
 * ```
 */
export function createEventStream(
  event: H3Event,
  opts?: EventStreamOptions,
): EventStream {
  return new EventStream(event, opts);
}

/**
 * @experimental This function is experimental and might be unstable in some environments.
 */
export async function sendEventStream(
  event: H3Event,
  eventStream: EventStream,
) {
  setEventStreamHeaders(event);
  setResponseStatus(event, 200);
  event._handled = true;
  eventStream._handled = true;
  await sendStream(event, eventStream.stream);
}
