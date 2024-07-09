import { describe, it, expect } from "vitest";
import {
  readTextBody,
  appendResponseHeader,
  setResponseStatus,
  getRequestHeaders,
  getQuery,
} from "../src";
import { setupTest } from "./_setup";

describe("Plain handler", () => {
  const ctx = setupTest();

  it("works", async () => {
    ctx.app.use("/test/**", async (event) => {
      const body = await readTextBody(event);
      setResponseStatus(event, 201, "Created");
      appendResponseHeader(
        event,
        "content-type",
        "application/json;charset=UTF-8",
      );
      appendResponseHeader(event, "set-cookie", "a=123");
      appendResponseHeader(event, "set-cookie", "b=123");
      appendResponseHeader(event, "set-cookie", "c=123");
      appendResponseHeader(event, "set-cookie", "d=123");
      return {
        method: event.method,
        path: event.path,
        headers: getRequestHeaders(event),
        body,
        contextKeys: Object.keys(event.context),
        query: getQuery(event),
      };
    });

    const res = await ctx.plainHandler(
      {
        method: "POST",
        path: "/test/foo/bar?test=123",
        headers: [["x-test", "true"]],
        body: "request body",
      },
      {
        test: true,
      },
    );

    expect(res).toMatchObject({
      status: 201,
      statusText: "Created",
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "set-cookie": "a=123, b=123, c=123, d=123",
      },
      setCookie: ["a=123", "b=123", "c=123", "d=123"],
    });

    expect(typeof res.body).toBe("string");
    expect(JSON.parse(res.body as string)).toMatchObject({
      method: "POST",
      path: "/test/foo/bar?test=123",
      body: "request body",
      headers: {
        "content-type": "text/plain;charset=UTF-8",
        "x-test": "true",
      },
      contextKeys: ["test"],
      query: { test: "123" },
    });
  });
});
