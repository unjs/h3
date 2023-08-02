import { describe, it, expect, beforeEach } from "vitest";
import {
  createApp,
  App,
  toPlainHandler,
  PlainHandler,
  eventHandler,
} from "../src";

describe("Plain handler", () => {
  let app: App;
  let handler: PlainHandler;

  beforeEach(() => {
    app = createApp({ debug: true });
    handler = toPlainHandler(app);
  });

  it("works", async () => {
    app.use(
      "/test",
      eventHandler(async (event) => {
        const body =
          event.method === "POST" ? await event.request.text() : undefined;
        event.node.res.statusCode = 201;
        event.node.res.statusMessage = "Created";
        return {
          method: event.method,
          path: event.path,
          headers: [...event.headers.entries()],
          body,
          contextKeys: Object.keys(event.context),
        };
      })
    );

    const res = await handler({
      method: "POST",
      path: "/test/foo/bar",
      headers: {
        "X-Test": "true",
      },
      body: "request body",
      context: {
        test: true,
      },
    });

    expect(res).toMatchObject({
      status: 201,
      statusText: "Created",
      headers: [["content-type", "application/json"]],
    });

    expect(typeof res.body).toBe("string");
    expect(JSON.parse(res.body as string)).toMatchObject({
      method: "POST",
      path: "/foo/bar",
      body: "request body",
      headers: [["x-test", "true"]],
      contextKeys: ["test"],
    });
  });
});
