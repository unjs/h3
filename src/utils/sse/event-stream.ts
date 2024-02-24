import type { H3Event } from "../../event";
import { getHeader } from "../request";
import { EventStreamMessage, EventStreamOptions } from "./types";
import { formatEventStreamMessage, formatEventStreamMessages } from "./utils";

/**
 * A helper class for [server sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format)
 */
export class EventStream {
  private readonly _h3Event: H3Event;
  private readonly _transformStream = new TransformStream();
  private readonly _writer: WritableStreamDefaultWriter;
  private readonly _encoder: TextEncoder = new TextEncoder();

  private _writerIsClosed = false;
  private _paused = false;
  private _unsentData: undefined | string;
  private _disposed = false;
  _handled = false;

  public lastEventId?: string;

  constructor(event: H3Event, opts: EventStreamOptions = {}) {
    this._h3Event = event;
    this.lastEventId = getHeader(event, "Last-Event-ID");
    this._writer = this._transformStream.writable.getWriter();
    this._writer.closed.then(() => {
      this._writerIsClosed = true;
    });
    if (opts.autoclose !== false) {
      this._h3Event.node.req.on("close", () => this.close());
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
    if (this._writerIsClosed) {
      return;
    }
    if (this._paused && !this._unsentData) {
      this._unsentData = formatEventStreamMessage(message);
      return;
    }
    if (this._paused) {
      this._unsentData += formatEventStreamMessage(message);
      return;
    }
    await this._writer
      .write(this._encoder.encode(formatEventStreamMessage(message)))
      .catch();
  }

  private async sendEvents(messages: EventStreamMessage[]) {
    if (this._writerIsClosed) {
      return;
    }
    const payload = formatEventStreamMessages(messages);
    if (this._paused && !this._unsentData) {
      this._unsentData = payload;
      return;
    }
    if (this._paused) {
      this._unsentData += payload;
      return;
    }

    await this._writer.write(this._encoder.encode(payload)).catch();
  }

  pause() {
    this._paused = true;
  }

  get isPaused() {
    return this._paused;
  }

  async resume() {
    this._paused = false;
    await this.flush();
  }

  async flush() {
    if (this._writerIsClosed) {
      return;
    }
    if (this._unsentData?.length) {
      await this._writer.write(this._encoder.encode(this._unsentData));
      this._unsentData = undefined;
    }
  }

  /**
   * Close the stream and the connection if the stream is being sent to the client
   */
  async close() {
    if (this._disposed) {
      return;
    }
    if (!this._writerIsClosed) {
      await this._writer.close().catch();
    }
    // check if the stream has been given to the client before closing the connection
    if (
      this._h3Event._handled &&
      this._handled &&
      !this._h3Event.node.res.closed
    ) {
      this._h3Event.node.res.end();
    }
    this._disposed = true;
  }

  /**
   * - `close` triggers when the writable stream is closed. It is also triggered after calling the `close()` method.
   * - `request:close` triggers when the request connection has been closed by either the client or the server.
   */
  on(event: "close" | "request:close", callback: () => any): void {
    switch (event) {
      case "close": {
        this._writer.closed.then(callback);
        break;
      }
      case "request:close": {
        this._h3Event.node.req.on("close", callback);
        break;
      }
      default: {
        event satisfies never; // ensures that the switch is exhaustive
        break;
      }
    }
  }

  get stream() {
    return this._transformStream.readable;
  }
}

export function isEventStream(input: unknown): input is EventStream {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  return input instanceof EventStream;
}
