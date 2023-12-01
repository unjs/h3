import { getHeader } from "./request";
import { sendStream, setHeaders, setResponseStatus } from "./response";
import { H3Event } from "src/event";

export function createEventStream(event: H3Event) {
  return new EventStream(event);
}

export class EventStream {
  private readonly h3Event: H3Event;
  lastEventId?: string;
  private readonly transformStream = new TransformStream();
  private readonly writer: WritableStreamDefaultWriter;
  private readonly encoder: TextEncoder = new TextEncoder();

  constructor(event: H3Event) {
    this.h3Event = event;
    setEventStreamHeaders(event);
    setResponseStatus(event, 200);
    this.lastEventId = getHeader(event, "Last-Event-ID");
    this.writer = this.transformStream.writable.getWriter();
  }

  async push(message: EventStreamMessage) {
    await this.publishEvent(message);
  }

  private async publishEvent(message: EventStreamMessage) {
    await this.writer.write(
      this.encoder.encode(formatEventStreamMessage(message)),
    );
  }

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

  async start() {
    this.h3Event._handled = true;
    await sendStream(this.h3Event, this.stream);
  }
}

export interface EventStreamMessage {
  id?: string;
  event?: string;
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
  result += `data: ${message.data}\n\n`;
  return result;
}

function setEventStreamHeaders(event: H3Event) {
  setHeaders(event, {
    "Transfer-Encoding": "chunked",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });
}
