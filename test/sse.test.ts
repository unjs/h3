import { describe, it, beforeEach, expect, vi } from "vitest";
import { createEventStream, getQuery } from "../src";
import {
  formatEventStreamMessage,
  formatEventStreamMessages,
} from "../src/utils/internal/event-stream";
import { setupTest } from "./_setup";

describe.todo("Server Sent Events (SSE)", () => {
  const ctx = setupTest();

  beforeEach(() => {
    ctx.app.use("/sse", (event) => {
      const includeMeta = getQuery(event).includeMeta !== undefined;
      const eventStream = createEventStream(event);
      const interval = setInterval(() => {
        if (includeMeta) {
          eventStream.push({
            id: "1",
            event: "custom-event",
            data: "hello world",
          });
          return;
        }
        eventStream.push("hello world");
      });
      eventStream.onClosed(() => {
        clearInterval(interval);
      });
      return eventStream.send();
    });
  });

  it("streams events", async () => {
    let messageCount = 0;

    const res = await ctx.fetch("/sse");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const reader = res.body?.getReader();
    let done = false;
    while (messageCount < 3 && !done) {
      const { value, done: _done } = await reader!.read();
      if (value) {
        messageCount++;
        const message = new TextDecoder().decode(value);
        expect(message).toEqual("data: hello world\n\n");
      }
      done = _done;
    }
    await vi.waitUntil(() => messageCount > 3, { timeout: 1000 });
    expect(messageCount > 3).toBe(true);
  });

  it("streams events with metadata", async () => {
    const messageCount = 0;
    // ctx.request
    //   .get("/sse?includeMeta=true")
    //   .expect(200)
    //   .expect("Content-Type", "text/event-stream")
    //   .buffer()
    //   .parse((res, callback) => {
    //     res.on("data", (chunk: Buffer) => {
    //       messageCount++;
    //       const message = chunk.toString();
    //       expect(message).toEqual(
    //         `id: 1\nevent: custom-event\ndata: hello world\n\n`,
    //       );
    //     });
    //     res.on("end", () => {
    //       callback(null, "");
    //     });
    //   })
    //   .then()
    //   .catch();
    await vi.waitUntil(() => messageCount > 3, { timeout: 1000 });
    expect(messageCount > 3).toBe(true);
  });
});

it("properly formats sse messages", () => {
  const result = formatEventStreamMessage({ data: "hello world" });
  expect(result).toEqual(`data: hello world\n\n`);
  const result2 = formatEventStreamMessage({
    id: "1",
    event: "custom-event",
    retry: 10,
    data: "hello world",
  });
  expect(result2).toEqual(
    `id: 1\nevent: custom-event\nretry: 10\ndata: hello world\n\n`,
  );
});

it("properly formats multiple sse messages", () => {
  const result = formatEventStreamMessages([
    {
      data: "hello world",
    },

    { id: "1", data: "hello world 2" },
  ]);
  expect(result).toEqual(`data: hello world\n\nid: 1\ndata: hello world 2\n\n`);
});
