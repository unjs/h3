import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import {
  createApp,
  App,
  sendRedirect,
  useBase,
  assertMethod,
  toNodeListener,
  eventHandler,
  getQuery,
  getRequestURL,
  readFormData,
  getRequestIP,
  getFingerprint,
} from "../src";

describe("", () => {
  let app: App;
  let request: SuperTest<Test>;

  beforeEach(() => {
    app = createApp({ debug: false });
    request = supertest(toNodeListener(app));
  });

  describe("sendRedirect", () => {
    it("can redirect URLs", async () => {
      app.use(
        eventHandler((event) => sendRedirect(event, "https://google.com")),
      );
      const result = await request.get("/");

      expect(result.header.location).toBe("https://google.com");
      expect(result.header["content-type"]).toBe("text/html");
    });
  });

  describe("useBase", () => {
    it("can prefix routes", async () => {
      app.use(
        "/",
        useBase(
          "/api",
          eventHandler((event) => Promise.resolve(event.path)),
        ),
      );
      const result = await request.get("/api/test");

      expect(result.text).toBe("/test");
    });
    it("does nothing when not provided a base", async () => {
      app.use(
        "/",
        useBase(
          "",
          eventHandler((event) => Promise.resolve(event.path)),
        ),
      );
      const result = await request.get("/api/test");

      expect(result.text).toBe("/api/test");
    });
  });

  describe("getQuery", () => {
    it("can parse query params", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          const query = getQuery(event);
          expect(query).toMatchObject({
            bool: "true",
            name: "string",
            number: "1",
          });
          return "200";
        }),
      );
      const result = await request.get(
        "/api/test?bool=true&name=string&number=1",
      );

      expect(result.text).toBe("200");
    });
  });

  describe("getMethod", () => {
    it("can get method", async () => {
      app.use(
        "/",
        eventHandler((event) => event.method),
      );
      expect((await request.get("/api")).text).toBe("GET");
      expect((await request.post("/api")).text).toBe("POST");
    });
  });

  describe("getRequestURL", () => {
    const tests = [
      { path: "/foo", url: "http://127.0.0.1/foo" },
      { path: "//foo", url: "http://127.0.0.1/foo" },
      { path: "//foo.com//bar", url: "http://127.0.0.1/foo.com//bar" },
      { path: "///foo", url: "http://127.0.0.1/foo" },
      { path: "\\foo", url: "http://127.0.0.1/foo" },
      { path: "\\\\foo", url: "http://127.0.0.1/foo" },
      { path: "\\/foo", url: "http://127.0.0.1/foo" },
      { path: "/\\foo", url: "http://127.0.0.1/foo" },
      { path: "/test", host: "example.com", url: "http://example.com/test" },
      {
        path: "/test",
        headers: [["x-forwarded-proto", "https"]],
        url: "https://127.0.0.1:80/test",
      },
      {
        path: "/test",
        headers: [["x-forwarded-host", "example.com"]],
        url: "http://example.com/test",
      },
    ];
    for (const test of tests) {
      it("getRequestURL: " + JSON.stringify(test), async () => {
        app.use(
          "/",
          eventHandler((event) => {
            const url = getRequestURL(event, {
              xForwardedProto: true,
              xForwardedHost: true,
            });
            // @ts-ignore
            url.port = 80;
            return url;
          }),
        );
        const req = request.get(test.path);
        if (test.host) {
          req.set("Host", test.host);
        }
        if (test.headers) {
          for (const header of test.headers) {
            req.set(header[0], header[1]);
          }
        }
        expect((await req).text).toBe(JSON.stringify(test.url));
      });
    }
  });

  describe("getRequestIP", () => {
    it("x-forwarded-for", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return getRequestIP(event, {
            xForwardedFor: true,
          });
        }),
      );
      const req = request.get("/");
      req.set("x-forwarded-for", "127.0.0.1");
      expect((await req).text).toBe("127.0.0.1");
    });
    it("ports", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return getRequestIP(event, {
            xForwardedFor: true,
          });
        }),
      );
      const req = request.get("/");
      req.set("x-forwarded-for", "127.0.0.1:1234");
      expect((await req).text).toBe("127.0.0.1:1234");
    });
    it("ipv6", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return getRequestIP(event, {
            xForwardedFor: true,
          });
        }),
      );
      const req = request.get("/");
      req.set("x-forwarded-for", "2001:0db8:85a3:0000:0000:8a2e:0370:7334");
      expect((await req).text).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });
  });

  describe("getFingerPrint", () => {
    it("returns an hash", async () => {
      app.use(
          "/",
          eventHandler(async (event) => {
            return getFingerprint(event);
          }),
      );

      const req = request.get("/");

      // sha1 is 40 chars long
      expect((await req).text).toHaveLength(40);
      // and only uses hex chars
      expect((await req).text).toMatch(/^[0-9A-Fa-f]+$/);
    });

    it("returns the same hash every time for same request", async () => {
      app.use(
          "/",
          eventHandler(async (event) => {
            return getFingerprint(event);
          }),
      );

      const req = request.get("/");
      expect((await req).text).toBe("41af4f039ba1d0960689b305e23d39cd458f6cb2");
      expect((await req).text).toBe("41af4f039ba1d0960689b305e23d39cd458f6cb2");
    });

    it("uses user agent when available", async () => {
        app.use(
            "/",
            eventHandler(async (event) => {
                return getFingerprint(event);
            }),
        );

        const req = request.get("/");
        req.set("user-agent", "test");

        expect((await req).text).toBe("6ae9b40f2df7f80b128ae283a6d60a3c7a81a342");
    });

    it("uses x-forwarded-for ip when header set", async () => {
        app.use(
            "/",
            eventHandler(async (event) => {
                return getFingerprint(event);
            }),
        );

        const req = request.get("/");
        req.set("x-forwarded-for", "something");

        expect((await req).text).toBe("37d612d6f0ac50d2875b128dfa89bd9d1bcb9174");
    });

    it('uses the request ip when no x-forwarded-for header set', async () => {
      app.use(
          "/",
          eventHandler(async (event) => {
            return getFingerprint(event);
          }),
      );
      app.options.onRequest = e => {
        Object.defineProperty(e.node.req.socket, 'remoteAddress', { get(): any { return 'something' } });
      }

      const req = request.get("/");

      expect((await req).text).toBe("37d612d6f0ac50d2875b128dfa89bd9d1bcb9174");
    });
  })

  describe("assertMethod", () => {
    it("only allow head and post", async () => {
      app.use(
        "/post",
        eventHandler((event) => {
          assertMethod(event, "POST", true);
          return "ok";
        }),
      );
      expect((await request.get("/post")).status).toBe(405);
      expect((await request.post("/post")).status).toBe(200);
      expect((await request.head("/post")).status).toBe(200);
    });
  });

  const below18 = Number.parseInt(process.version.slice(1).split(".")[0]) < 18;
  describe.skipIf(below18)("readFormData", () => {
    it("can handle form as FormData in event handler", async () => {
      app.use(
        "/",
        eventHandler(async (event) => {
          const formData = await readFormData(event);
          const user = formData.get("user");
          expect(formData instanceof FormData).toBe(true);
          expect(user).toBe("john");
          return { user };
        }),
      );

      const result = await request
        .post("/api/test")
        .set("content-type", "application/x-www-form-urlencoded; charset=utf-8")
        .field("user", "john");

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ user: "john" });
    });
  });
});
