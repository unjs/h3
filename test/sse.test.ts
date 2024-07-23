import { beforeEach } from "vitest";
import { createEventStream } from "../src";
import {
  formatEventStreamMessage,
  formatEventStreamMessages,
} from "../src/utils/internal/event-stream";
import { describeMatrix } from "./_setup";

describeMatrix("sse", (t, { it, expect }) => {
  beforeEach(() => {
    t.app.get("/sse", (event) => {
      const includeMeta = event.searchParams.get("includeMeta") === "true";
      const eventStream = createEventStream(event);
      let counter = 0;
      const clear = setInterval(() => {
        if (counter++ === 3) {
          clearInterval(clear);
          eventStream.close();
          return; // TODO: eventStream.push should auto disable after close!
        }
        if (includeMeta) {
          eventStream.push({
            id: String(counter),
            event: "custom-event",
            data: "hello world",
          });
        } else {
          eventStream.push("hello world");
        }
      });
      return eventStream.send();
    });
  });

  // TODO: Investigate issues with web target

  it.skipIf(t.target === "web")("streams events", async () => {
    const res = await t.fetch("/sse");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const messages = (await res.text()).split("\n\n").filter(Boolean);
    expect(messages.length).toBe(3);
  });

  it.skipIf(t.target === "web")("streams events", async () => {
    const res = await t.fetch("/sse?includeMeta=true");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const messages = (await res.text()).split("\n\n").filter(Boolean);
    expect(messages.length).toBe(3);
  });

  // TODO: unit test

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
    expect(result).toEqual(
      `data: hello world\n\nid: 1\ndata: hello world 2\n\n`,
    );
  });
});
