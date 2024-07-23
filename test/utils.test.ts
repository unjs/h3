import { beforeEach } from "vitest";
import {
  redirect,
  withBase,
  assertMethod,
  getQuery,
  getRequestURL,
  getRequestIP,
  getRequestFingerprint,
} from "../src";
import { describeMatrix } from "./_setup";

describeMatrix("utils", (t, { it, describe, expect }) => {
  describe("redirect", () => {
    it("can redirect URLs", async () => {
      t.app.use((event) => redirect(event, "https://google.com"));
      const result = await t.fetch("/");
      expect(result.headers.get("location")).toBe("https://google.com");
      expect(result.headers.get("content-type")).toBe("text/html");
    });
  });

  describe("withBase", () => {
    it("can prefix routes", async () => {
      t.app.use(
        "/**",
        withBase("/api", (event) => Promise.resolve(event.path)),
      );
      const result = await t.fetch("/api/test");

      expect(await result.text()).toBe("/test");
    });
    it("does nothing when not provided a base", async () => {
      t.app.use(
        "/**",
        withBase("", (event) => Promise.resolve(event.path)),
      );
      const result = await t.fetch("/api/test");

      expect(await result.text()).toBe("/api/test");
    });
  });

  describe("getQuery", () => {
    it("can parse query params", async () => {
      t.app.get("/**", (event) => {
        const query = getQuery(event);
        expect(query).toMatchObject({
          bool: "true",
          name: "string",
          number: "1",
        });
        return "200";
      });
      const result = await t.fetch("/api/test?bool=true&name=string&number=1");

      expect(await result.text()).toBe("200");
    });
  });

  describe("getMethod", () => {
    it("can get method", async () => {
      t.app.all("/*", (event) => event.request.method);
      expect(await (await t.fetch("/api")).text()).toBe("GET");
      expect(await (await t.fetch("/api", { method: "POST" })).text()).toBe(
        "POST",
      );
    });
  });

  describe("getRequestURL", () => {
    beforeEach(() => {
      t.app.get("/**", (event) => {
        return getRequestURL(event, {
          xForwardedProto: true,
          xForwardedHost: true,
        }).href;
      });
    });

    const tests = [
      ["http://localhost/foo?bar=baz", "http://localhost/foo?bar=baz"],
      ["http://localhost\\foo", "http://localhost/foo"],
      // TODO: Fix issues with web normalizing URLs
      ...(t.target === "web"
        ? []
        : [
            ["http://localhost//foo", "http://localhost/foo"],
            ["http://localhost//foo//bar", "http://localhost/foo//bar"],
            ["http://localhost///foo", "http://localhost/foo"],
            ["http://localhost\\\\foo", "http://localhost/foo"],
            ["http://localhost\\/foo", "http://localhost/foo"],
            ["http://localhost/\\foo", "http://localhost/foo"],
            ["http://example.com/test", "http://example.com/test"],
            ["http://localhost:8080/test", "http://localhost:8080/test"],
          ]),
    ];
    for (const test of tests) {
      it(`getRequestURL(${JSON.stringify(test[0])})`, async () => {
        const res = await t.fetch(test[0]);
        expect(await res.text()).toMatch(test[1]);
      });
    }

    it('x-forwarded-proto: "https"', async () => {
      expect(
        await t
          .fetch("/", {
            headers: {
              "x-forwarded-proto": "https",
            },
          })
          .then((r) => r.text()),
      ).toMatch("https://localhost");

      // TODO
      // expect(
      //   await t
      //     .fetch("https://localhost/", {
      //       headers: {
      //         "x-forwarded-proto": "http",
      //       },
      //     })
      //     .then((r) => r.text()),
      // ).toMatch("http://localhost/");
    });
  });

  describe("getRequestIP", () => {
    it("x-forwarded-for", async () => {
      t.app.get("/", (event) => {
        return getRequestIP(event, {
          xForwardedFor: true,
        });
      });
      const res = await t.fetch("/", {
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
      });
      expect(await res.text()).toBe("127.0.0.1");
    });
    it("ports", async () => {
      t.app.get("/", (event) => {
        return getRequestIP(event, {
          xForwardedFor: true,
        });
      });
      const res = await t.fetch("/", {
        headers: {
          "x-forwarded-for": "127.0.0.1:1234",
        },
      });
      expect(await res.text()).toBe("127.0.0.1:1234");
    });
    it("ipv6", async () => {
      t.app.get("/", (event) => {
        return getRequestIP(event, {
          xForwardedFor: true,
        });
      });
      const res = await t.fetch("/", {
        headers: {
          "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        },
      });
      expect(await res.text()).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });
    it("multiple ips", async () => {
      t.app.get("/", (event) => {
        return getRequestIP(event, {
          xForwardedFor: true,
        });
      });
      const res = await t.fetch("/", {
        headers: {
          "x-forwarded-for": "client , proxy1, proxy2",
        },
      });
      expect(await res.text()).toBe("client");
    });
  });

  describe("getRequestFingerprint", () => {
    it("returns an hash", async () => {
      t.app.use((event) =>
        getRequestFingerprint(event, { xForwardedFor: true }),
      );

      const res = await t.fetch("/", {
        headers: {
          "x-forwarded-for": "client-ip",
        },
      });
      const fingerprint = await res.text();

      // sha1 is 40 chars long
      expect(fingerprint).toHaveLength(40);

      // and only uses hex chars
      expect(fingerprint).toMatch(/^[\dA-Fa-f]+$/);
    });

    it("returns the same hash every time for same request", async () => {
      t.app.use((event) => getRequestFingerprint(event, { hash: false }));
      for (let i = 0; i < 3; i++) {
        const res = await t.fetch("/");
        expect(await res.text()).toBe(t.target === "web" ? "" : "::1");
      }
    });

    it("returns null when all detections impossible", async () => {
      t.app.use((event) =>
        getRequestFingerprint(event, { hash: false, ip: false }),
      );
      expect(await (await t.fetch("/")).text()).toBe("");
    });

    it("can use path/method", async () => {
      t.app.use((event) =>
        getRequestFingerprint(event, {
          hash: false,
          ip: false,
          path: true,
          method: true,
        }),
      );

      const res = await t.fetch("/foo", { method: "POST" });

      expect(await res.text()).toBe("POST|/foo");
    });

    it("uses user agent when available", async () => {
      t.app.use((event) =>
        getRequestFingerprint(event, { hash: false, userAgent: true }),
      );

      const res = await t.fetch("/", {
        headers: {
          "user-agent": "test-user-agent",
        },
      });

      expect(await res.text()).toBe(
        t.target === "web" ? "test-user-agent" : "::1|test-user-agent",
      );
    });

    it("uses x-forwarded-for ip when header set", async () => {
      t.app.use((event) =>
        getRequestFingerprint(event, { hash: false, xForwardedFor: true }),
      );

      const res = await t.fetch("/", {
        headers: {
          "x-forwarded-for": "x-forwarded-for",
        },
      });

      expect(await res.text()).toBe("x-forwarded-for");
    });

    it("uses the request ip when no x-forwarded-for header set", async () => {
      t.app.use((event) => getRequestFingerprint(event, { hash: false }));

      t.app.config.onRequest = (event) => {
        Object.defineProperty(event.node?.req.socket || {}, "remoteAddress", {
          get(): any {
            return "0.0.0.0";
          },
        });
      };

      const res = await t.fetch("/");

      expect(await res.text()).toBe(t.target == "web" ? "" : "0.0.0.0");
    });
  });

  describe("assertMethod", () => {
    it("only allow head and post", async () => {
      t.app.all("/post", (event) => {
        assertMethod(event, "POST", true);
        return "ok";
      });
      expect((await t.fetch("/post")).status).toBe(405);
      expect((await t.fetch("/post", { method: "POST" })).status).toBe(200);
      expect((await t.fetch("/post", { method: "HEAD" })).status).toBe(200);
    });
  });
});
