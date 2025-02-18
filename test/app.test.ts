import { Readable, Transform } from "node:stream";
import { fromNodeHandler } from "../src/adapters/node";
import { createError } from "../src";
import { describeMatrix } from "./_setup";

describeMatrix("app", (t, { it, expect }) => {
  it("can return JSON directly", async () => {
    t.app.get("/api", (event) => ({ url: event.path }));
    const res = await t.fetch("/api");

    expect(await res.json()).toEqual({ url: "/api" });
  });

  it("can return bigint directly", async () => {
    t.app.get("/", () => BigInt(9_007_199_254_740_991));
    const res = await t.fetch("/");

    expect(await res.text()).toBe("9007199254740991");
  });

  it("throws error when returning symbol or function", async () => {
    t.app.get("/fn", () => {
      return function foo() {};
    });
    t.app.get("/symbol", () => {
      return Symbol.for("foo");
    });

    const resFn = await t.fetch("/fn");
    expect(resFn.status).toBe(500);
    expect((await resFn.json()).statusMessage).toBe(
      "[h3] Cannot send function as response.",
    );

    const resSymbol = await t.fetch("/symbol");
    expect(resSymbol.status).toBe(500);
    expect((await resSymbol.json()).statusMessage).toBe(
      "[h3] Cannot send symbol as response.",
    );
  });

  it("can return Response directly", async () => {
    t.app.use(
      "/",
      () =>
        new Response("Hello World!", {
          status: 201,
          headers: { "x-test": "test" },
        }),
    );
    const res = await t.fetch("/");
    expect(res.status).toBe(201);
    expect(await res.text()).toBe("Hello World!");
  });

  it("can return a null response", async () => {
    t.app.get("/api", () => null);
    const res = await t.fetch("/api");

    expect(res.status).toBe(200);
    expect(await res.text()).toEqual("");
    expect(res.ok).toBeTruthy();
  });

  it("can return primitive values", async () => {
    const values = [true, false, 42, 0, 1];
    for (const value of values) {
      t.app.use(`/${value}`, () => value);
      expect(await (await t.fetch(`/${value}`)).json()).toEqual(value);
    }
  });

  it("can return Blob directly", async () => {
    t.app.use(() => {
      return new Blob(["<h1>Hello World</h1>"], {
        type: "text/html",
      });
    });
    const res = await t.fetch("/");

    expect(res.headers.get("content-type")).toBe("text/html");
    expect(await res.text()).toBe("<h1>Hello World</h1>");
  });

  it("can return Buffer directly", async () => {
    t.app.use(() => Buffer.from("<h1>Hello world!</h1>", "utf8"));
    const res = await t.fetch("/");

    expect(await res.text()).toBe("<h1>Hello world!</h1>");
  });

  it.runIf(t.target === "node")("Node.js Readable Stream", async () => {
    t.app.use(() => {
      return new Readable({
        read() {
          this.push(Buffer.from("<h1>Hello world!</h1>", "utf8"));
          this.push(null);
        },
      });
    });
    const res = await t.fetch("/");

    expect(await res.text()).toBe("<h1>Hello world!</h1>");
    expect(res.headers.get("transfer-encoding")).toBe("chunked");
  });

  it.runIf(t.target === "node")(
    "Node.js Readable Stream with Error",
    async () => {
      t.app.use(() => {
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
      const res = await t.fetch("/");
      expect(res.status).toBe(500);
      expect(JSON.parse(await res.text()).statusMessage).toBe("test");
    },
  );

  it("Web Stream", async () => {
    t.app.use(() => {
      return new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("<h1>Hello world!</h1>"));
          controller.close();
        },
      });
    });
    const res = await t.fetch("/");

    expect(await res.text()).toBe("<h1>Hello world!</h1>");
    // expect(res.headers.get("transfer-encoding")).toBe("chunked"); // TODO: h3 should add this header
  });

  it("Web Stream with Error", async () => {
    t.app.use(() => {
      return new ReadableStream({
        start() {
          throw createError({
            statusCode: 500,
            statusText: "test",
          });
        },
      });
    });
    const res = await t.fetch("/");

    expect(res.status).toBe(500);
    expect(JSON.parse(await res.text()).statusMessage).toBe("test");
  });

  it("can return text directly", async () => {
    t.app.use(() => "Hello world!");
    const res = await t.fetch("/");

    expect(await res.text()).toBe("Hello world!");
  });

  it("allows overriding Content-Type", async () => {
    t.app.use((event) => {
      event.response.setHeader("content-type", "text/xhtml");
      return "<h1>Hello world!</h1>";
    });
    const res = await t.fetch("/");

    expect(res.headers.get("content-type")).toBe("text/xhtml");
  });

  it("can match simple prefixes", async () => {
    t.app.get("/1", () => "prefix1");
    t.app.get("/2", () => "prefix2");
    const res = await t.fetch("/2");

    expect(await res.text()).toBe("prefix2");
  });

  it("can chain .use calls", async () => {
    t.app.get("/1", () => "prefix1").use("/2", () => "prefix2");
    const res = await t.fetch("/2");

    expect(await res.text()).toBe("prefix2");
  });

  it("can use async routes", async () => {
    t.app.get("/promise", async () => {
      return await Promise.resolve("42");
    });
    t.app.use(async () => {});

    const res = await t.fetch("/promise");
    expect(await res.text()).toBe("42");
  });

  // TODO
  it("prohibits use of next() in non-promisified handlers", () => {
    t.app.get("/", () => {});
  });

  it("handles next() call with no routes matching", async () => {
    t.app.use("/", () => {});
    t.app.use("/", () => {});

    const response = await t.fetch("/");
    expect(response.status).toEqual(404);
  });

  it("can take an object", async () => {
    t.app.use({ route: "/", handler: () => "valid" });

    const response = await t.fetch("/");
    expect(await response.text()).toEqual("valid");
  });

  it("can short-circuit route matching", async () => {
    t.app.use(() => "done");
    t.app.use(() => "valid");

    const response = await t.fetch("/");
    expect(await response.text()).toEqual("done");
  });

  it("can normalise route definitions", async () => {
    t.app.get("/test/", () => "valid");

    const res = await t.fetch("/test");
    expect(await res.text()).toBe("valid");
  });

  it("can add arabic routes", async () => {
    t.app.get("/عربي", () => "valid");

    const res = await t.fetch("/عربي");
    expect(res.status).toBe(200);
  });

  it.skipIf(t.target !== "node")(
    "wait for node middleware (req, res, next)",
    async () => {
      t.app.use(
        "/",
        fromNodeHandler((_req, res, next) => {
          setTimeout(() => {
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ works: 1 }));
            next();
          }, 10);
        }),
      );
      const res = await t.fetch("/");
      expect(await res.json()).toEqual({ works: 1 });
    },
  );
});
