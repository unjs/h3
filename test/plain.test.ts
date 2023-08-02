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
        event.node.res.setHeader("content-type", "application/json");
        event.node.res.appendHeader("set-cookie", "a=123, b=123");
        event.node.res.appendHeader("set-Cookie", ["c=123"]);
        event.node.res.appendHeader("set-cookie", "d=123");
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
      headers: [["x-test", "true"]],
      body: "request body",
      context: {
        test: true,
      },
    });

    expect(res).toMatchObject({
      status: 201,
      statusText: "Created",
      headers: [
        ["content-type", "application/json"],
        ["set-cookie", "a=123"],
        ["set-cookie", "b=123"],
        ["set-cookie", "c=123"],
        ["set-cookie", "d=123"],
      ],
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
