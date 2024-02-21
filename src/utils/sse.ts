import { getHeader } from "./request";
import { sendStream, setResponseHeaders, setResponseStatus } from "./response";
import { HTTPHeaderName } from "src/types";
import { H3Event } from "src/event";

/**
 * Initialize an EventStream instance for creating [server sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
 *
 * @param event H3Event
 * @param autoclose Automatically close the writable stream when the request is closed
 *
 * ####  Example
 * ```ts
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
export function createEventStream(event: H3Event, autoclose = false) {
  return new EventStream(event, autoclose);
}

/**
 * A helper class for [server sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format)
 */
export class EventStream {
  private readonly h3Event: H3Event;
  lastEventId?: string;
  private readonly transformStream = new TransformStream();
  private readonly writer: WritableStreamDefaultWriter;
  private readonly encoder: TextEncoder = new TextEncoder();
  private paused = false;
  private unsentData: undefined | string;
  private disposed = false;
  _handled = false;

  /**
   *
   * @param event H3Event
   * @param autoclose Automatically close the stream when the request has been closed
   */
  constructor(event: H3Event, autoclose = false) {
    this.h3Event = event;
    this.lastEventId = getHeader(event, "Last-Event-ID");
    this.writer = this.transformStream.writable.getWriter();
    if (autoclose) {
      this.h3Event.node.req.on("close", () => this.close());
    }
  }

  /**
   * Publish new event(s) for the client
   */
  async push(message: string): Promise<void>;
  async push(message: string[]): Promise<void>;
  async push(message: EventStreamMessage): Promise<void>;
  async push(message: EventStreamMessage[]): Promise<void>;
  async push(
    message: EventStreamMessage | EventStreamMessage[] | string | string[],
  ) {
    if (typeof message === "string") {
      await this.sendEvent({ data: message });
      return;
    }
    if (Array.isArray(message)) {
      if (message.length === 0) {
        return;
      }
      if (typeof message[0] === "string") {
        const msgs: EventStreamMessage[] = [];
        for (const item of message as string[]) {
          msgs.push({ data: item });
        }
        await this.sendEvents(msgs);
        return;
      }
      await this.sendEvents(message as EventStreamMessage[]);
      return;
    }
    await this.sendEvent(message);
  }

  private async sendEvent(message: EventStreamMessage) {
    if (this.paused && !this.unsentData) {
      this.unsentData = formatEventStreamMessage(message);
      return;
    }
    if (this.paused) {
      this.unsentData += formatEventStreamMessage(message);
      return;
    }
    await this.writer.write(
      this.encoder.encode(formatEventStreamMessage(message)),
    );
  }

  private async sendEvents(messages: EventStreamMessage[]) {
    const payload = formatEventStreamMessages(messages);
    if (this.paused && !this.unsentData) {
      this.unsentData = payload;
      return;
    }
    if (this.paused) {
      this.unsentData += payload;
      return;
    }
    await this.writer.write(this.encoder.encode(payload));
  }

  pause() {
    this.paused = true;
  }

  get isPaused() {
    return this.paused;
  }

  async resume() {
    this.paused = false;
    await this.flush();
  }

  async flush() {
    if (this.unsentData?.length) {
      await this.writer.write(this.encoder.encode(this.unsentData));
      this.unsentData = undefined;
    }
  }

  /**
   * Close the stream and the connection if the stream is being sent to the client
   */
  async close() {
    if (this.disposed) {
      return;
    }
    await this.writer.close().catch();
    this.writer.releaseLock();

    // check if the stream has been given to the client before closing the connection
    if (
      this.h3Event._handled &&
      this._handled &&
      !this.h3Event.node.res.closed
    ) {
      this.h3Event.node.res.end();
    }
    this.disposed = true;
  }

  /**
   * - `close` triggers when the writable stream is closed. It is also triggered after calling the `close()` method.
   * - `request:close` triggers when the request connection has been closed by either the client or the server.
   */
  on(event: "close" | "request:close", callback: () => any): void {
    switch (event) {
      case "close": {
        this.writer.closed.then(callback);
        break;
      }
      case "request:close": {
        this.h3Event.node.req.on("close", callback);
        break;
      }
      default: {
        event satisfies never; // ensures that the switch is exhaustive
        break;
      }
    }
  }

  get stream() {
    return this.transformStream.readable;
  }
}

export function isEventStream(input: unknown): input is EventStream {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  return input instanceof EventStream;
}

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

/**
 * See https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#fields
 */
export interface EventStreamMessage {
  id?: string;
  event?: string;
  retry?: number;
  data: string;
}

export function formatEventStreamMessage(message: EventStreamMessage): string {
  let result = "";
  if (message.id) {
    result += `id: ${message.id}\n`;
  }
  if (message.event) {
    result += `event: ${message.event}\n`;
  }
  if (typeof message.retry === "number" && Number.isInteger(message.retry)) {
    result += `retry: ${message.retry}\n`;
  }
  result += `data: ${message.data}\n\n`;
  return result;
}

export function formatEventStreamMessages(
  messages: EventStreamMessage[],
): string {
  let result = "";
  for (const msg of messages) {
    result += formatEventStreamMessage(msg);
  }
  return result;
}

function setEventStreamHeaders(event: H3Event) {
  const headers: Partial<
    Record<HTTPHeaderName, string | number | readonly string[]>
  > = {
    "Content-Type": "text/event-stream",
    "Cache-Control":
      "private, no-cache, no-store, no-transform, must-revalidate, max-age=0",
    "X-Accel-Buffering": "no", // prevent nginx from buffering the response
  };

  if (!isHttp2Request(event)) {
    headers.Connection = "keep-alive";
  }

  setResponseHeaders(event, headers);
}

export function isHttp2Request(event: H3Event) {
  return (
    getHeader(event, ":path") !== undefined &&
    getHeader(event, ":method") !== undefined
  );
}
