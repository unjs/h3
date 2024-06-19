import supertest, { SuperTest, Test } from "supertest";
import { describe, it, beforeEach, expect } from "vitest";
import {
  App,
  createApp,
  createEventStream,
  eventHandler,
  getQuery,
  toNodeListener,
} from "../src";
import {
  formatEventStreamMessage,
  formatEventStreamMessages,
} from "../src/utils/sse/utils";

describe("Server Sent Events (SSE)", () => {
  let app: App;
  let request: SuperTest<Test>;
  beforeEach(() => {
    app = createApp({ debug: true });
    app.use(
      "/sse",
      eventHandler((event) => {
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
      }),
    );
    request = supertest(toNodeListener(app)) as any;
  });
  it("streams events", async () => {
    let messageCount = 0;
    request
      .get("/sse")
      .expect(200)
      .expect("Content-Type", "text/event-stream")
      .buffer()
      .parse((res, callback) => {
        res.on("data", (chunk: Buffer) => {
          messageCount++;
          const message = chunk.toString();
          expect(message).toEqual("data: hello world\n\n");
        });
        res.on("end", () => {
          callback(null, "");
        });
      })
      .then()
      .catch();
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 100);
    });
    expect(messageCount > 10).toBe(true);
  });
  it("streams events with metadata", async () => {
    let messageCount = 0;
    request
      .get("/sse?includeMeta=true")
      .expect(200)
      .expect("Content-Type", "text/event-stream")
      .buffer()
      .parse((res, callback) => {
        res.on("data", (chunk: Buffer) => {
          messageCount++;
          const message = chunk.toString();
          expect(message).toEqual(
            `id: 1\nevent: custom-event\ndata: hello world\n\n`,
          );
        });
        res.on("end", () => {
          callback(null, "");
        });
      })
      .then()
      .catch();
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 100);
    });
    expect(messageCount > 10).toBe(true);
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
