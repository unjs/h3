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
  getMethod,
  getQuery,
  getRequestURL,
  getRequestFromEvent,
  getFormData,
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
        eventHandler((event) => sendRedirect(event, "https://google.com"))
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
          eventHandler((event) => Promise.resolve(event.node.req.url || "none"))
        )
      );
      const result = await request.get("/api/test");

      expect(result.text).toBe("/test");
    });
    it("does nothing when not provided a base", async () => {
      app.use(
        "/",
        useBase(
          "",
          eventHandler((event) => Promise.resolve(event.node.req.url || "none"))
        )
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
        })
      );
      const result = await request.get(
        "/api/test?bool=true&name=string&number=1"
      );

      expect(result.text).toBe("200");
    });
  });

  describe("getMethod", () => {
    it("can get method", async () => {
      app.use(
        "/",
        eventHandler((event) => getMethod(event))
      );
      expect((await request.get("/api")).text).toBe("GET");
      expect((await request.post("/api")).text).toBe("POST");
    });
  });

  describe("getRequestURL", () => {
    const tests = [
      { path: "/foo", url: "http://127.0.0.1/foo" },
      { path: "//foo", url: "http://127.0.0.1/foo" },
      { path: "//foo.com//bar", url: "http://127.0.0.1/foo.com/bar" },
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
          })
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

  describe("assertMethod", () => {
    it("only allow head and post", async () => {
      app.use(
        "/post",
        eventHandler((event) => {
          assertMethod(event, "POST", true);
          return "ok";
        })
      );
      expect((await request.get("/post")).status).toBe(405);
      expect((await request.post("/post")).status).toBe(200);
      expect((await request.head("/post")).status).toBe(200);
    });
  });

  const below18 = Number.parseInt(process.version.slice(1).split(".")[0]) < 18;
  describe.skipIf(below18)("getRequestFromEvent", () => {
    it("can handle request as Request in event handler", async () => {
      app.use(
        "/",
        eventHandler(async (event) => {
          const nativeRequest = await getRequestFromEvent(event);
          expect(nativeRequest instanceof Request).toBe(true);
          expect(nativeRequest.method).toBe("POST");
          expect(nativeRequest.headers.get("hello")).toBe("world");
          const body = await nativeRequest.json();
          expect(body).toMatchObject({
            user: "john",
          });
          return "ok";
        })
      );

      const result = await request
        .post("/api/test")
        .set("hello", "world")
        .set("content-type", "application/json")
        .send({ user: "john" });

      expect(result.status).toBe(200);
    });

    it("can handle form as FormData in event handler", async () => {
      app.use(
        "/",
        eventHandler(async (event) => {
          const formData = await getFormData(event);
          const user = formData.get("user");
          expect(formData instanceof FormData).toBe(true);
          expect(user).toBe("john");
          return { user };
        })
      );

      const result = await request
        .post("/api/test")
        .set("content-type", "application/x-www-form-urlencoded")
        .field("user", "john");

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ user: "john" });
    });
  });
});
