import { describe, it, expect } from "vitest";
import {
  eventHandler,
  readJSONBody,
  readBodyStream,
  getRequestURL,
  getRequestHeaders,
} from "../src";
import { setupTest } from "./_utils";

describe("Event", () => {
  const ctx = setupTest();

  it("can read the method", async () => {
    ctx.app.use(
      "/",
      eventHandler((event) => {
        expect(event.method).toBe(event.method);
        expect(event.method).toBe("POST");
        return "200";
      }),
    );
    const result = await ctx.request.post("/hello");
    expect(result.text).toBe("200");
  });

  it("can read the headers", async () => {
    ctx.app.use(
      "/",
      eventHandler((event) => {
        return {
          headers: [...new Headers(getRequestHeaders(event)).entries()],
        };
      }),
    );
    const result = await ctx.request
      .post("/hello")
      .set("X-Test", "works")
      .set("Cookie", ["a", "b"]);
    const { headers } = JSON.parse(result.text) as {
      headers: [string, string][];
    };
    expect(headers.find(([key]) => key === "x-test")?.[1]).toBe("works");
    expect(headers.find(([key]) => key === "cookie")?.[1]).toBe("a; b");
  });

  it("can get request url", async () => {
    ctx.app.use(
      "/",
      eventHandler((event) => {
        return getRequestURL(event).toString();
      }),
    );
    const result = await ctx.request.get("/hello");
    expect(result.text).toMatch(/http:\/\/127.0.0.1:\d+\/hello/);
  });

  it("can read request body", async () => {
    ctx.app.use(
      "/",
      eventHandler(async (event) => {
        const bodyStream = readBodyStream(event);
        let bytes = 0;
        // @ts-expect-error iterator
        for await (const chunk of bodyStream!) {
          bytes += chunk.length;
        }
        return {
          bytes,
        };
      }),
    );

    const result = await ctx.request
      .post("/hello")
      .send(Buffer.from([1, 2, 3]));

    expect(result.body).toMatchObject({ bytes: 3 });
  });

  it("can convert to a web request", async () => {
    ctx.app.use(
      "/",
      eventHandler(async (event) => {
        expect(event.method).toBe("POST");
        expect(event.headers.get("x-test")).toBe("123");
        // TODO: Find a workaround for Node.js 16
        if (!process.versions.node.startsWith("16")) {
          expect(await readJSONBody(event)).toMatchObject({ hello: "world" });
        }
        return "200";
      }),
    );
    const result = await ctx.request
      .post("/")
      .set("x-test", "123")
      .set("content-type", "application/json")
      .send(JSON.stringify({ hello: "world" }));

    expect(result.text).toBe("200");
  });

  it("can read path with URL", async () => {
    ctx.app.use(
      "/",
      eventHandler((event) => {
        expect(event.path).toBe("/?url=https://example.com");
        return "200";
      }),
    );

    const result = await ctx.request.get("/?url=https://example.com");

    expect(result.text).toBe("200");
  });
});
