import { getHeader } from "./request";
import { sendStream, setHeaders, setResponseStatus } from "./response";
import { H3Event } from "src/event";

/**
 * Initialize an EventStream instance for creating [server sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
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
 *
 *
 */
export function createEventStream(event: H3Event) {
  return new EventStream(event);
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

  constructor(event: H3Event) {
    this.h3Event = event;
    this.lastEventId = getHeader(event, "Last-Event-ID");
    this.writer = this.transformStream.writable.getWriter();
  }

  /**
   * Publish a new event for the client
   */
  async push(message: EventStreamMessage | string) {
    if (typeof message === "string") {
      await this.sendEvent({ data: message });
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
   * Stop streaming and close the connection
   */
  end() {
    this.h3Event.node.res.end();
  }

  on(event: "disconnect" | "end", callback: () => any): void {
    switch (event) {
      case "disconnect": {
        this.h3Event.node.req.on("close", callback);
        break;
      }
      case "end": {
        this.h3Event.node.req.on("end", callback);
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

function setEventStreamHeaders(event: H3Event) {
  setHeaders(event, {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });
}
