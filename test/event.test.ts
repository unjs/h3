import { describe, it, expect } from "vitest";
import { readBody, getRequestURL } from "../src";
import { setupTest } from "./_setup";

describe("Event", () => {
  const ctx = setupTest();

  it("can read the method", async () => {
    ctx.app.use("/*", (event) => {
      expect(event.request.method).toBe(event.request.method);
      expect(event.request.method).toBe("POST");
      return "200";
    });
    const result = await ctx.fetch("/hello", { method: "POST" });
    expect(await result.text()).toBe("200");
  });

  it("can read the headers", async () => {
    ctx.app.use("/*", (event) => {
      return {
        headers: [...event.request.headers.entries()],
      };
    });
    const result = await ctx.fetch("/hello", {
      method: "POST",
      headers: {
        "X-Test": "works",
        Cookie: "a; b",
      },
    });
    const { headers } = JSON.parse(await result.text()) as {
      headers: [string, string][];
    };
    expect(headers.find(([key]) => key === "x-test")?.[1]).toBe("works");
    expect(headers.find(([key]) => key === "cookie")?.[1]).toBe("a; b");
  });

  it("can get request url", async () => {
    ctx.app.use("/*", (event) => {
      return getRequestURL(event);
    });
    const result = await ctx.fetch("http://test.com/hello");
    expect(await result.text()).toMatch("http://test.com/hello");
  });

  it("can read request body", async () => {
    ctx.app.use("/*", async (event) => {
      let bytes = 0;
      // @ts-expect-error iterator
      for await (const chunk of event.request.body!) {
        bytes += chunk.length;
      }
      return {
        bytes,
      };
    });

    const result = await ctx.fetch("/hello", {
      method: "POST",
      body: new Uint8Array([1, 2, 3]),
    });

    expect(await result.json()).toMatchObject({ bytes: 3 });
  });

  it("can convert to a web request", async () => {
    ctx.app.use("/", async (event) => {
      expect(event.request.method).toBe("POST");
      expect(event.request.headers.get("x-test")).toBe("123");
      expect(await readBody(event)).toMatchObject({ hello: "world" });
      return "200";
    });
    const result = await ctx.fetch("/", {
      method: "POST",
      headers: {
        "x-test": "123",
        "content-type": "application/json",
      },
      body: JSON.stringify({ hello: "world" }),
    });

    expect(await result.text()).toBe("200");
  });

  it("can read path with URL", async () => {
    ctx.app.use("/", (event) => {
      expect(event.path).toBe("/?url=https://example.com");
      return "200";
    });

    const result = await ctx.fetch("/?url=https://example.com");

    expect(await result.text()).toBe("200");
  });
});
