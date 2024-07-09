import { Readable, Transform } from "node:stream";
import { describe, it, expect } from "vitest";
import { fromNodeHandler } from "../src/adapters/node";
import { createError, setResponseHeader } from "../src";
import { setupTest } from "./_setup";

describe("app", () => {
  const ctx = setupTest();

  it("can return JSON directly", async () => {
    ctx.app.use("/api", (event) => ({ url: event.path }));
    const res = await ctx.request.get("/api");

    expect(res.body).toEqual({ url: "/api" });
  });

  it("can return bigint directly", async () => {
    ctx.app.use("/", () => BigInt(9_007_199_254_740_991));
    const res = await ctx.request.get("/");

    expect(res.text).toBe("9007199254740991");
  });

  it("throws error when returning symbol or function", async () => {
    ctx.app.use("/fn", () => {
      return function foo() {};
    });
    ctx.app.use("/symbol", () => {
      return Symbol.for("foo");
    });

    const resFn = await ctx.request.get("/fn");
    expect(resFn.status).toBe(500);
    expect(resFn.body.statusMessage).toBe(
      "[h3] Cannot send function as response.",
    );

    const resSymbol = await ctx.request.get("/symbol");
    expect(resSymbol.status).toBe(500);
    expect(resSymbol.body.statusMessage).toBe(
      "[h3] Cannot send symbol as response.",
    );
  });

  it("can return Response directly", async () => {
    ctx.app.use(
      "/",
      () =>
        new Response("Hello World!", {
          status: 201,
          headers: { "x-test": "test" },
        }),
    );
    const res = await ctx.request.get("/");
    expect(res.statusCode).toBe(201);
    expect(res.text).toBe("Hello World!");
  });

  it("can return a 204 response", async () => {
    ctx.app.use("/api", () => null);
    const res = await ctx.request.get("/api");

    expect(res.statusCode).toBe(204);
    expect(res.text).toEqual("");
    expect(res.ok).toBeTruthy();
  });

  it("can return primitive values", async () => {
    const values = [true, false, 42, 0, 1];
    for (const value of values) {
      ctx.app.use(`/${value}`, () => value);
      expect(await ctx.request.get(`/${value}`).then((r) => r.body)).toEqual(
        value,
      );
    }
  });

  it("can return Blob directly", async () => {
    ctx.app.use(() => {
      return new Blob(["<h1>Hello World</h1>"], {
        type: "text/html",
      });
    });
    const res = await ctx.request.get("/");

    expect(res.headers["content-type"]).toBe("text/html");
    expect(res.text).toBe("<h1>Hello World</h1>");
  });

  it("can return Buffer directly", async () => {
    ctx.app.use(() => Buffer.from("<h1>Hello world!</h1>", "utf8"));
    const res = await ctx.request.get("/");

    expect(res.body.toString("utf8")).toBe("<h1>Hello world!</h1>");
  });

  it("Node.js Readable Stream", async () => {
    ctx.app.use(() => {
      return new Readable({
        read() {
          this.push(Buffer.from("<h1>Hello world!</h1>", "utf8"));
          this.push(null);
        },
      });
    });
    const res = await ctx.request.get("/");

    expect(res.text).toBe("<h1>Hello world!</h1>");
    expect(res.header["transfer-encoding"]).toBe("chunked");
  });

  it("Node.js Readable Stream with Error", async () => {
    ctx.app.use(() => {
      return new Readable({
        read() {
          this.push(Buffer.from("123", "utf8"));
          this.push(null);
        },
      }).pipe(
        new Transform({
          transform(_chunk, _encoding, callback) {
            const err = createError({
              statusCode: 500,
              statusText: "test",
            });
            setTimeout(() => callback(err), 0);
          },
        }),
      );
    });
    const res = await ctx.request.get("/");
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.text).statusMessage).toBe("test");
  });

  it("Web Stream", async () => {
    ctx.app.use(() => {
      return new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("<h1>Hello world!</h1>"));
          controller.close();
        },
      });
    });
    const res = await ctx.request.get("/");

    expect(res.text).toBe("<h1>Hello world!</h1>");
    expect(res.header["transfer-encoding"]).toBe("chunked");
  });

  it("Web Stream with Error", async () => {
    ctx.app.use(() => {
      return new ReadableStream({
        start() {
          throw createError({
            statusCode: 500,
            statusText: "test",
          });
        },
      });
    });
    const res = await ctx.request.get("/");

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.text).statusMessage).toBe("test");
  });

  it("can return HTML directly", async () => {
    ctx.app.use(() => "<h1>Hello world!</h1>");
    const res = await ctx.request.get("/");

    expect(res.text).toBe("<h1>Hello world!</h1>");
    expect(res.header["content-type"]).toBe("text/html");
  });

  it("allows overriding Content-Type", async () => {
    ctx.app.use((event) => {
      setResponseHeader(event, "content-type", "text/xhtml");
      return "<h1>Hello world!</h1>";
    });
    const res = await ctx.request.get("/");

    expect(res.header["content-type"]).toBe("text/xhtml");
  });

  it("can match simple prefixes", async () => {
    ctx.app.use("/1", () => "prefix1");
    ctx.app.use("/2", () => "prefix2");
    const res = await ctx.request.get("/2");

    expect(res.text).toBe("prefix2");
  });

  it("can chain .use calls", async () => {
    ctx.app.use("/1", () => "prefix1").use("/2", () => "prefix2");
    const res = await ctx.request.get("/2");

    expect(res.text).toBe("prefix2");
  });

  it("can use async routes", async () => {
    ctx.app.use("/promise", async () => {
      return await Promise.resolve("42");
    });
    ctx.app.use(async () => {});

    const res = await ctx.request.get("/promise");
    expect(res.text).toBe("42");
  });

  it("prohibits use of next() in non-promisified handlers", () => {
    ctx.app.use("/", () => {});
  });

  it("handles next() call with no routes matching", async () => {
    ctx.app.use("/", () => {});
    ctx.app.use("/", () => {});

    const response = await ctx.request.get("/");
    expect(response.status).toEqual(404);
  });

  it("can take an object", async () => {
    ctx.app.use({ prefix: "/", handler: () => "valid" });

    const response = await ctx.request.get("/");
    expect(response.text).toEqual("valid");
  });

  it("can short-circuit route matching", async () => {
    ctx.app.use(() => "done");
    ctx.app.use(() => "valid");

    const response = await ctx.request.get("/");
    expect(response.text).toEqual("done");
  });

  it("can normalise route definitions", async () => {
    ctx.app.use("/test/", () => "valid");

    const res = await ctx.request.get("/test");
    expect(res.text).toBe("valid");
  });

  it("wait for middleware (req, res, next)", async () => {
    ctx.app.use(
      "/",
      fromNodeHandler((_req, res, next) => {
        setTimeout(() => {
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ works: 1 }));
          next();
        }, 10);
      }),
    );
    const res = await ctx.request.get("/");
    expect(res.body).toEqual({ works: 1 });
  });
});
