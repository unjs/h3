import { describe, it, expect } from "vitest";
import {
  eventHandler,
  readTextBody,
  setResponseStatus,
  getRequestHeaders,
  getQuery,
} from "../src";
import { setupTest } from "./_setup";

describe("Web handler", () => {
  const ctx = setupTest();

  it("works", async () => {
    ctx.app.use(
      "/test",
      eventHandler(async (event) => {
        const body = await readTextBody(event);
        setResponseStatus(event, 201, "Created");
        return {
          method: event.method,
          path: event.path,
          headers: getRequestHeaders(event),
          query: getQuery(event),
          body,
          contextKeys: Object.keys(event.context),
        };
      }),
    );

    const res = await ctx.webHandler(
      new Request(new URL("/test/foo/bar?test=123", "http://localhost"), {
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
      path: "/foo/bar?test=123",
      body: "request body",
      headers: {
        "content-type": "text/plain;charset=UTF-8",
        "x-test": "true",
      },
      query: {
        test: "123",
      },
      contextKeys: ["test"],
    });
  });
});
