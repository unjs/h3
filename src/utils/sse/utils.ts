import type { H3Event, ResponseHeaders } from "../../types";
import { getRequestHeader } from "../request";
import { setResponseHeaders } from "../response";
import { EventStreamMessage } from "./types";

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

export function setEventStreamHeaders(event: H3Event) {
  const headers: ResponseHeaders = {
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
    getRequestHeader(event, ":path") !== undefined &&
    getRequestHeader(event, ":method") !== undefined
  );
}
