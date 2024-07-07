import { describe, it, expect } from "vitest";
import {
  getRequestHeaders,
  getRequestHeader,
  setResponseHeaders,
  setResponseHeader,
  appendResponseHeaders,
  appendResponseHeader,
  removeResponseHeader,
  clearResponseHeaders,
} from "../src";
import { setupTest } from "./_setup";

describe("", () => {
  const ctx = setupTest();

  describe("getRequestHeaders", () => {
    it("can return request headers", async () => {
      ctx.app.use("/", (event) => {
        const headers = getRequestHeaders(event);
        expect(headers).toMatchObject({
          accept: "application/json",
        });
      });
      await ctx.request.get("/").set("Accept", "application/json");
    });
  });

  describe("getRequestHeaders", () => {
    it("can return request headers", async () => {
      ctx.app.use("/", (event) => {
        const headers = getRequestHeaders(event);
        expect(headers).toMatchObject({ accept: "application/json" });
      });
      await ctx.request.get("/").set("Accept", "application/json");
    });
  });

  describe("getRequestHeader", () => {
    it("can return a value of request header corresponding to the given name", async () => {
      ctx.app.use("/", (event) => {
        expect(getRequestHeader(event, "accept")).toEqual("application/json");
        expect(getRequestHeader(event, "Accept")).toEqual("application/json");
        expect(getRequestHeader(event, "cookie")).toEqual("a; b; c");
      });
      await ctx.request
        .get("/")
        .set("Accept", "application/json")
        .set("Cookie", ["a", "b", "c"]);
    });
  });

  describe("getRequestHeader", () => {
    it("can return a value of request header corresponding to the given name", async () => {
      ctx.app.use("/", (event) => {
        expect(getRequestHeader(event, "accept")).toEqual("application/json");
        expect(getRequestHeader(event, "Accept")).toEqual("application/json");
      });
      await ctx.request.get("/").set("Accept", "application/json");
    });
  });

  describe("setResponseHeaders", () => {
    it("can set multiple values to multiple response headers corresponding to the given object", async () => {
      ctx.app.use("/", (event) => {
        setResponseHeaders(event, {
          "X-HTTP-Header-1": "string-value-1",
          "X-HTTP-Header-2": "string-value-2",
        });
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header-1"]).toEqual("string-value-1");
      expect(result.headers["x-http-header-2"]).toEqual("string-value-2");
    });
  });

  describe("setResponseHeaders", () => {
    it("can set multiple values to multiple response headers corresponding to the given object", async () => {
      ctx.app.use("/", (event) => {
        setResponseHeaders(event, {
          "X-HTTP-Header-1": "string-value-1",
          "X-HTTP-Header-2": "string-value-2",
        });
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header-1"]).toEqual("string-value-1");
      expect(result.headers["x-http-header-2"]).toEqual("string-value-2");
    });
  });

  describe("setResponseHeader", () => {
    it("can set a string value to response header corresponding to the given name", async () => {
      ctx.app.use("/", (event) => {
        setResponseHeader(event, "X-HTTP-Header", "string-value");
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header"]).toEqual("string-value");
    });

    it("can set a number value to response header corresponding to the given name", async () => {
      ctx.app.use("/", (event) => {
        setResponseHeader(event, "X-HTTP-Header", 12_345 as unknown as string);
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header"]).toEqual("12345");
    });

    it("can set an array value to response header corresponding to the given name", async () => {
      ctx.app.use("/", (event) => {
        setResponseHeader(event, "X-HTTP-Header", ["value 1", "value 2"]);
        setResponseHeader(event, "X-HTTP-Header", ["value 3", "value 4"]);
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header"]).toEqual("value 3, value 4");
    });
  });

  describe("setResponseHeader", () => {
    it("can set a string value to response header corresponding to the given name", async () => {
      ctx.app.use("/", (event) => {
        setResponseHeader(event, "X-HTTP-Header", "string-value");
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header"]).toEqual("string-value");
    });

    it("can set a number value to response header corresponding to the given name", async () => {
      ctx.app.use("/", (event) => {
        setResponseHeader(event, "X-HTTP-Header", "12345");
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header"]).toEqual("12345");
    });

    it("can set an array value to response header corresponding to the given name", async () => {
      ctx.app.use("/", (event) => {
        setResponseHeader(event, "X-HTTP-Header", ["value 1", "value 2"]);
        setResponseHeader(event, "X-HTTP-Header", ["value 3", "value 4"]);
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header"]).toEqual("value 3, value 4");
    });
  });

  describe("appendResponseHeaders", () => {
    it("can append multiple string values to multiple response header corresponding to the given object", async () => {
      ctx.app.use("/", (event) => {
        appendResponseHeaders(event, {
          "X-HTTP-Header-1": "string-value-1-1",
          "X-HTTP-Header-2": "string-value-2-1",
        });
        appendResponseHeaders(event, {
          "X-HTTP-Header-1": "string-value-1-2",
          "X-HTTP-Header-2": "string-value-2-2",
        });
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header-1"]).toEqual(
        "string-value-1-1, string-value-1-2",
      );
      expect(result.headers["x-http-header-2"]).toEqual(
        "string-value-2-1, string-value-2-2",
      );
    });
  });

  describe("appendResponseHeaders", () => {
    it("can append multiple string values to multiple response header corresponding to the given object", async () => {
      ctx.app.use("/", (event) => {
        appendResponseHeaders(event, {
          "X-HTTP-Header-1": "string-value-1-1",
          "X-HTTP-Header-2": "string-value-2-1",
        });
        appendResponseHeaders(event, {
          "X-HTTP-Header-1": "string-value-1-2",
          "X-HTTP-Header-2": "string-value-2-2",
        });
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header-1"]).toEqual(
        "string-value-1-1, string-value-1-2",
      );
      expect(result.headers["x-http-header-2"]).toEqual(
        "string-value-2-1, string-value-2-2",
      );
    });
  });

  describe("appendResponseHeader", () => {
    it("can append a value to response header corresponding to the given name", async () => {
      ctx.app.use("/", (event) => {
        appendResponseHeader(event, "X-HTTP-Header", "value 1");
        appendResponseHeader(event, "X-HTTP-Header", "value 2");
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header"]).toEqual("value 1, value 2");
    });
  });

  describe("appendHeader", () => {
    it("can append a value to response header corresponding to the given name", async () => {
      ctx.app.use("/", (event) => {
        appendResponseHeader(event, "X-HTTP-Header", "value 1");
        appendResponseHeader(event, "X-HTTP-Header", "value 2");
      });
      const result = await ctx.request.get("/");
      expect(result.headers["x-http-header"]).toEqual("value 1, value 2");
    });
  });

  describe("clearResponseHeaders", () => {
    it("can remove all response headers", async () => {
      ctx.app.use("/", (event) => {
        appendResponseHeader(event, "header-1", "1");
        appendResponseHeader(event, "header-2", "2");
        clearResponseHeaders(event);
      });
      const result = await ctx.request.get("/");
      expect(result.headers["header-1"]).toBeUndefined();
      expect(result.headers["header-2"]).toBeUndefined();
    });

    it("can remove multiple response headers", async () => {
      ctx.app.use("/", (event) => {
        appendResponseHeader(event, "header-3", "3");
        appendResponseHeader(event, "header-4", "4");
        appendResponseHeader(event, "header-5", "5");
        clearResponseHeaders(event, ["header-3", "header-5"]);
      });
      const result = await ctx.request.get("/");
      expect(result.headers["header-3"]).toBeUndefined();
      expect(result.headers["header-4"]).toBe("4");
      expect(result.headers["header-5"]).toBeUndefined();
    });

    it("can remove a single response header", async () => {
      ctx.app.use("/", (event) => {
        appendResponseHeader(event, "header-6", "6");
        appendResponseHeader(event, "header-7", "7");
        removeResponseHeader(event, "header-6");
      });
      const result = await ctx.request.get("/");
      expect(result.headers["header-6"]).toBeUndefined();
      expect(result.headers["header-7"]).toBe("7");
    });
  });
});
