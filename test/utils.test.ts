import { describe, it, expect } from "vitest";
import {
  redirect,
  withBase,
  assertMethod,
  getQuery,
  getRequestURL,
  getRequestIP,
  getRequestFingerprint,
} from "../src";
import { serializeIterableValue } from "../src/utils/internal/iterable";
import { setupTest } from "./_setup";

describe("", () => {
  const ctx = setupTest();

  describe("redirect", () => {
    it("can redirect URLs", async () => {
      ctx.app.use((event) => redirect(event, "https://google.com"));
      const result = await ctx.fetch("/");
      expect(result.headers.get("location")).toBe("https://google.com");
      expect(result.headers.get("content-type")).toBe("text/html");
    });
  });

  describe("serializeIterableValue", () => {
    const exampleDate: Date = new Date(Date.UTC(2015, 6, 21, 3, 24, 54, 888));
    it.each([
      { value: "Hello, world!", output: "Hello, world!" },
      { value: 123, output: "123" },
      { value: 1n, output: "1" },
      { value: true, output: "true" },
      { value: false, output: "false" },
      { value: undefined, output: undefined },
      { value: null, output: "null" },
      { value: exampleDate, output: JSON.stringify(exampleDate) },
      { value: { field: 1 }, output: '{"field":1}' },
      { value: [1, 2, 3], output: "[1,2,3]" },
      { value: () => {}, output: undefined },
      {
        value: Buffer.from("Hello, world!"),
        output: Buffer.from("Hello, world!"),
      },
      { value: Uint8Array.from([1, 2, 3]), output: Uint8Array.from([1, 2, 3]) },
    ])("$value => $output", ({ value, output }) => {
      const serialized = serializeIterableValue(value);
      expect(serialized).toStrictEqual(output);
    });
  });

  describe("withBase", () => {
    it("can prefix routes", async () => {
      ctx.app.use(
        "/**",
        withBase("/api", (event) => Promise.resolve(event.path)),
      );
      const result = await ctx.fetch("/api/test");

      expect(await result.text()).toBe("/test");
    });
    it("does nothing when not provided a base", async () => {
      ctx.app.use(
        "/**",
        withBase("", (event) => Promise.resolve(event.path)),
      );
      const result = await ctx.fetch("/api/test");

      expect(await result.text()).toBe("/api/test");
    });
  });

  describe("getQuery", () => {
    it("can parse query params", async () => {
      ctx.app.use("/**", (event) => {
        const query = getQuery(event);
        expect(query).toMatchObject({
          bool: "true",
          name: "string",
          number: "1",
        });
        return "200";
      });
      const result = await ctx.fetch(
        "/api/test?bool=true&name=string&number=1",
      );

      expect(await result.text()).toBe("200");
    });
  });

  describe("getMethod", () => {
    it("can get method", async () => {
      ctx.app.use("/*", (event) => event.request.method);
      expect(await (await ctx.fetch("/api")).text()).toBe("GET");
      expect(await (await ctx.fetch("/api", { method: "POST" })).text()).toBe(
        "POST",
      );
    });
  });

  describe.todo("getRequestURL", () => {
    const tests = [
      { path: "/foo", url: "http://localhost/foo" },
      { path: "//foo", url: "http://localhost/foo" },
      { path: "//foo.com//bar", url: "http://localhost/foo.com//bar" },
      { path: "///foo", url: "http://localhost/foo" },
      { path: String.raw`\foo`, url: "http://localhost/foo" },
      { path: String.raw`\\foo`, url: "http://localhost/foo" },
      { path: String.raw`\/foo`, url: "http://localhost/foo" },
      { path: String.raw`/\foo`, url: "http://localhost/foo" },
      { path: "http://example.com/test", url: "http://example.com/test" },
      {
        path: "/test",
        headers: [["x-forwarded-proto", "https"]],
        url: "https://localhost:80/test",
      },
      {
        path: "/test",
        headers: [["x-forwarded-host", "example.com"]],
        url: "http://example.com/test",
      },
    ];
    for (const test of tests) {
      it("getRequestURL: " + JSON.stringify(test), async () => {
        ctx.app.use("/**", (event) => {
          const url = getRequestURL(event, {
            xForwardedProto: true,
            xForwardedHost: true,
          });
          // @ts-ignore
          url.port = 80;
          return url;
        });
        const res = await ctx.fetch(test.path, {
          headers: {
            ...Object.fromEntries(test.headers || []),
          },
        });
        expect(await res.text()).toBe(JSON.stringify(test.url));
      });
    }
  });

  describe("getRequestIP", () => {
    it("x-forwarded-for", async () => {
      ctx.app.use("/", (event) => {
        return getRequestIP(event, {
          xForwardedFor: true,
        });
      });
      const res = await ctx.fetch("/", {
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
      });
      expect(await res.text()).toBe("127.0.0.1");
    });
    it("ports", async () => {
      ctx.app.use("/", (event) => {
        return getRequestIP(event, {
          xForwardedFor: true,
        });
      });
      const res = await ctx.fetch("/", {
        headers: {
          "x-forwarded-for": "127.0.0.1:1234",
        },
      });
      expect(await res.text()).toBe("127.0.0.1:1234");
    });
    it("ipv6", async () => {
      ctx.app.use("/", (event) => {
        return getRequestIP(event, {
          xForwardedFor: true,
        });
      });
      const res = await ctx.fetch("/", {
        headers: {
          "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        },
      });
      expect(await res.text()).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });
    it("multiple ips", async () => {
      ctx.app.use("/", (event) => {
        return getRequestIP(event, {
          xForwardedFor: true,
        });
      });
      const res = await ctx.fetch("/", {
        headers: {
          "x-forwarded-for": "client , proxy1, proxy2",
        },
      });
      expect(await res.text()).toBe("client");
    });
  });

  describe("getRequestFingerprint", () => {
    it.todo("returns an hash", async () => {
      ctx.app.use((event) => getRequestFingerprint(event));

      const res = await ctx.fetch("/");

      // sha1 is 40 chars long
      expect(await res.text()).toHaveLength(40);

      // and only uses hex chars
      expect(await res.text()).toMatch(/^[\dA-Fa-f]+$/);
    });

    it.todo("returns the same hash every time for same request", async () => {
      ctx.app.use((event) => getRequestFingerprint(event, { hash: false }));

      const res = await ctx.fetch("/");
      expect(await res.text()).toBe('"::ffff:127.0.0.1"');
      expect(await res.text()).toBe('"::ffff:127.0.0.1"');
    });

    it("returns null when all detections impossible", async () => {
      ctx.app.use((event) =>
        getRequestFingerprint(event, { hash: false, ip: false }),
      );
      expect(await (await ctx.fetch("/")).text()).toBe("");
    });

    it("can use path/method", async () => {
      ctx.app.use((event) =>
        getRequestFingerprint(event, {
          hash: false,
          ip: false,
          path: true,
          method: true,
        }),
      );

      const res = await ctx.fetch("/foo", { method: "POST" });

      expect(await res.text()).toBe("POST|/foo");
    });

    it("uses user agent when available", async () => {
      ctx.app.use((event) =>
        getRequestFingerprint(event, { hash: false, userAgent: true }),
      );

      const res = await ctx.fetch("/", {
        headers: {
          "user-agent": "test-user-agent",
        },
      });

      expect(await res.text()).toBe("test-user-agent");
    });

    it("uses x-forwarded-for ip when header set", async () => {
      ctx.app.use((event) =>
        getRequestFingerprint(event, { hash: false, xForwardedFor: true }),
      );

      const res = await ctx.fetch("/", {
        headers: {
          "x-forwarded-for": "x-forwarded-for",
        },
      });

      expect(await res.text()).toBe("x-forwarded-for");
    });

    it.todo(
      "uses the request ip when no x-forwarded-for header set",
      async () => {
        ctx.app.use((event) => getRequestFingerprint(event, { hash: false }));

        ctx.app.config.onRequest = (event) => {
          Object.defineProperty(event.node?.req.socket || {}, "remoteAddress", {
            get(): any {
              return "0.0.0.0";
            },
          });
        };

        const res = await ctx.fetch("/");

        expect(await res.text()).toBe('"0.0.0.0"');
      },
    );
  });

  describe("assertMethod", () => {
    it("only allow head and post", async () => {
      ctx.app.use("/post", (event) => {
        assertMethod(event, "POST", true);
        return "ok";
      });
      expect((await ctx.fetch("/post")).status).toBe(405);
      expect((await ctx.fetch("/post", { method: "POST" })).status).toBe(200);
      expect((await ctx.fetch("/post", { method: "HEAD" })).status).toBe(200);
    });
  });

  describe("readFormDataBody", () => {
    it("can handle form as FormData in event handler", async () => {
      ctx.app.use("/api/*", async (event) => {
        const formData = await event.request.formData();
        const user = formData!.get("user");
        expect(formData instanceof FormData).toBe(true);
        expect(user).toBe("john");
        return { user };
      });

      const result = await ctx.fetch("/api/test", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=utf-8",
        },
        body: "user=john",
      });

      expect(result.status).toBe(200);
      expect(await result.json()).toMatchObject({ user: "john" });
    });
  });
});
