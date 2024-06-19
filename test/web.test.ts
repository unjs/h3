import { describe, it, expect, beforeEach } from "vitest";
import {
  createApp,
  App,
  eventHandler,
  WebHandler,
  toWebHandler,
  readBody,
} from "../src";

describe("Web handler", () => {
  let app: App;
  let handler: WebHandler;

  beforeEach(() => {
    app = createApp({ debug: true });
    handler = toWebHandler(app);
  });

  it("works", async () => {
    app.use(
      "/test",
      eventHandler(async (event) => {
        const body =
          event.method === "POST" ? await readBody(event) : undefined;
        event.node.res.statusCode = 201;
        event.node.res.statusMessage = "Created";
        return {
          method: event.method,
          path: event.path,
          headers: [...event.headers.entries()],
          body,
          contextKeys: Object.keys(event.context),
        };
      }),
    );

    const res = await handler(
      new Request(new URL("/test/foo/bar", "http://localhost"), {
        method: "POST",
        headers: {
          "X-Test": "true",
        },
        body: "request body",
      }),
      {
        test: true,
      },
    );

    expect(res.status).toBe(201);
    expect(res.statusText).toBe("Created");
    expect([...res.headers.entries()]).toMatchObject([
      ["content-type", "application/json"],
    ]);

    expect(await res.json()).toMatchObject({
      method: "POST",
      path: "/foo/bar",
      body: "request body",
      headers: [
        ["content-type", "text/plain;charset=UTF-8"],
        ["x-test", "true"],
      ],
      contextKeys: ["test"],
    });
  });
});
