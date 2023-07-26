import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import {
  createApp,
  App,
  getRequestHeaders,
  getHeaders,
  getRequestHeader,
  getHeader,
  setResponseHeaders,
  setHeaders,
  setResponseHeader,
  setHeader,
  appendResponseHeaders,
  appendHeaders,
  appendResponseHeader,
  appendHeader,
  toNodeListener,
  eventHandler,
  removeResponseHeader,
  removeResponseHeaders,
} from "../src";

describe("", () => {
  let app: App;
  let request: SuperTest<Test>;

  beforeEach(() => {
    app = createApp({ debug: false });
    request = supertest(toNodeListener(app));
  });

  describe("getRequestHeaders", () => {
    it("can return request headers", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          const headers = getRequestHeaders(event);
          expect(headers).toEqual(event.node.req.headers);
        })
      );
      await request.get("/").set("Accept", "application/json");
    });
  });

  describe("getHeaders", () => {
    it("can return request headers", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          const headers = getHeaders(event);
          expect(headers).toEqual(event.node.req.headers);
        })
      );
      await request.get("/").set("Accept", "application/json");
    });
  });

  describe("getRequestHeader", () => {
    it("can return a value of request header corresponding to the given name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          expect(getRequestHeader(event, "accept")).toEqual("application/json");
          expect(getRequestHeader(event, "Accept")).toEqual("application/json");
          expect(getRequestHeader(event, "cookie")).toEqual("a; b; c");
        })
      );
      await request
        .get("/")
        .set("Accept", "application/json")
        .set("Cookie", ["a", "b", "c"]);
    });
  });

  describe("getHeader", () => {
    it("can return a value of request header corresponding to the given name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          expect(getHeader(event, "accept")).toEqual("application/json");
          expect(getHeader(event, "Accept")).toEqual("application/json");
        })
      );
      await request.get("/").set("Accept", "application/json");
    });
  });

  describe("setResponseHeaders", () => {
    it("can set multiple values to multiple response headers corresponding to the given object", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setResponseHeaders(event, {
            "Nuxt-HTTP-Header-1": "string-value-1",
            "Nuxt-HTTP-Header-2": "string-value-2",
          });
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header-1"]).toEqual("string-value-1");
      expect(result.headers["nuxt-http-header-2"]).toEqual("string-value-2");
    });
  });

  describe("setHeaders", () => {
    it("can set multiple values to multiple response headers corresponding to the given object", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setHeaders(event, {
            "Nuxt-HTTP-Header-1": "string-value-1",
            "Nuxt-HTTP-Header-2": "string-value-2",
          });
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header-1"]).toEqual("string-value-1");
      expect(result.headers["nuxt-http-header-2"]).toEqual("string-value-2");
    });
  });

  describe("setResponseHeader", () => {
    it("can set a string value to response header corresponding to the given name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setResponseHeader(event, "Nuxt-HTTP-Header", "string-value");
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header"]).toEqual("string-value");
    });

    it("can set a number value to response header corresponding to the given name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setResponseHeader(event, "Nuxt-HTTP-Header", 12_345);
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header"]).toEqual("12345");
    });

    it("can set an array value to response header corresponding to the given name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setResponseHeader(event, "Nuxt-HTTP-Header", ["value 1", "value 2"]);
          setResponseHeader(event, "Nuxt-HTTP-Header", ["value 3", "value 4"]);
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header"]).toEqual("value 3, value 4");
    });
  });

  describe("setHeader", () => {
    it("can set a string value to response header corresponding to the given name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setHeader(event, "Nuxt-HTTP-Header", "string-value");
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header"]).toEqual("string-value");
    });

    it("can set a number value to response header corresponding to the given name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setHeader(event, "Nuxt-HTTP-Header", 12_345);
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header"]).toEqual("12345");
    });

    it("can set an array value to response header corresponding to the given name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setHeader(event, "Nuxt-HTTP-Header", ["value 1", "value 2"]);
          setHeader(event, "Nuxt-HTTP-Header", ["value 3", "value 4"]);
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header"]).toEqual("value 3, value 4");
    });
  });

  describe("appendResponseHeaders", () => {
    it("can append multiple string values to multiple response header corresponding to the given object", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          appendResponseHeaders(event, {
            "Nuxt-HTTP-Header-1": "string-value-1-1",
            "Nuxt-HTTP-Header-2": "string-value-2-1",
          });
          appendResponseHeaders(event, {
            "Nuxt-HTTP-Header-1": "string-value-1-2",
            "Nuxt-HTTP-Header-2": "string-value-2-2",
          });
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header-1"]).toEqual(
        "string-value-1-1, string-value-1-2"
      );
      expect(result.headers["nuxt-http-header-2"]).toEqual(
        "string-value-2-1, string-value-2-2"
      );
    });
  });

  describe("appendHeaders", () => {
    it("can append multiple string values to multiple response header corresponding to the given object", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          appendHeaders(event, {
            "Nuxt-HTTP-Header-1": "string-value-1-1",
            "Nuxt-HTTP-Header-2": "string-value-2-1",
          });
          appendHeaders(event, {
            "Nuxt-HTTP-Header-1": "string-value-1-2",
            "Nuxt-HTTP-Header-2": "string-value-2-2",
          });
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header-1"]).toEqual(
        "string-value-1-1, string-value-1-2"
      );
      expect(result.headers["nuxt-http-header-2"]).toEqual(
        "string-value-2-1, string-value-2-2"
      );
    });
  });

  describe("appendResponseHeader", () => {
    it("can append a value to response header corresponding to the given name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          appendResponseHeader(event, "Nuxt-HTTP-Header", "value 1");
          appendResponseHeader(event, "Nuxt-HTTP-Header", "value 2");
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header"]).toEqual("value 1, value 2");
    });
  });

  describe("appendHeader", () => {
    it("can append a value to response header corresponding to the given name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          appendHeader(event, "Nuxt-HTTP-Header", "value 1");
          appendHeader(event, "Nuxt-HTTP-Header", "value 2");
        })
      );
      const result = await request.get("/");
      expect(result.headers["nuxt-http-header"]).toEqual("value 1, value 2");
    });
  });

  describe("removeResponseHeaders", () => {
    it("can remove all response headers", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          appendHeader(event, "header-1", "1");
          appendHeader(event, "header-2", "2");
          removeResponseHeaders(event);
        })
      );
      const result = await request.get("/");
      expect(result.headers["header-1"]).toBeUndefined();
      expect(result.headers["header-2"]).toBeUndefined();
    });

    it("can remove multiple response headers", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          appendHeader(event, "header-3", "3");
          appendHeader(event, "header-4", "4");
          appendHeader(event, "header-5", "5");
          removeResponseHeaders(event, ["header-3", "header-5"]);
        })
      );
      const result = await request.get("/");
      expect(result.headers["header-3"]).toBeUndefined();
      expect(result.headers["header-4"]).toBe("4");
      expect(result.headers["header-5"]).toBeUndefined();
    });

    it("can remove a single response header", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          appendHeader(event, "header-6", "6");
          appendHeader(event, "header-7", "7");
          removeResponseHeader(event, "header-6");
        })
      );
      const result = await request.get("/");
      expect(result.headers["header-6"]).toBeUndefined();
      expect(result.headers["header-7"]).toBe("7");
    });
  });
});
