import type { H3 } from "../src/types";
import { describe, it, expect, beforeEach } from "vitest";
import { getRouterParams, getRouterParam, createApp } from "../src";
import { setupTest } from "./_setup";

describe("router", () => {
  const ctx = setupTest();

  let router: H3;

  beforeEach(() => {
    router = createApp()
      .get("/", () => "Hello")
      .get("/test/?/a", () => "/test/?/a")
      .get("/many/routes", () => "many routes")
      .post("/many/routes", () => "many routes")
      .get("/test", () => "Test (GET)")
      .post("/test", () => "Test (POST)");

    ctx.app.use(router);
  });

  it("Handle route", async () => {
    const res = await ctx.request.get("/");
    expect(res.text).toEqual("Hello");
  });

  it("Multiple Routers", async () => {
    const secondRouter = createApp().get("/router2", () => "router2");

    ctx.app.use(secondRouter);

    const res1 = await ctx.request.get("/");
    expect(res1.text).toEqual("Hello");

    const res2 = await ctx.request.get("/router2");
    expect(res2.text).toEqual("router2");
  });

  it("Handle different methods", async () => {
    const res1 = await ctx.request.get("/test");
    expect(res1.text).toEqual("Test (GET)");
    const res2 = await ctx.request.post("/test");
    expect(res2.text).toEqual("Test (POST)");
  });
  it("Handle url with query parameters", async () => {
    const res = await ctx.request.get("/test?title=test");
    expect(res.status).toEqual(200);
  });

  it('Handle url with query parameters, include "?" in url path', async () => {
    const res = await ctx.request.get(
      "/test/?/a?title=test&returnTo=/path?foo=bar",
    );
    expect(res.status).toEqual(200);
  });

  it("Handle many methods (get)", async () => {
    const res = await ctx.request.get("/many/routes");
    expect(res.status).toEqual(200);
  });

  it("Handle many methods (post)", async () => {
    const res = await ctx.request.post("/many/routes");
    expect(res.status).toEqual(200);
  });

  it("Not matching route", async () => {
    const res = await ctx.request.get("/404");
    expect(res.status).toEqual(404);
  });

  it("Handle shadowed route", async () => {
    router.post("/test/123", (event) => `[${event.method}] ${event.path}`);

    router.use("/test/**", (event) => `[${event.method}] ${event.path}`);

    // Loop to validate cached behavior
    for (let i = 0; i < 5; i++) {
      const postRed = await ctx.request.post("/test/123");
      expect(postRed.status).toEqual(200);
      expect(postRed.text).toEqual("[POST] /test/123");

      const getRes = await ctx.request.get("/test/123");
      expect(getRes.status).toEqual(200);
      expect(getRes.text).toEqual("[GET] /test/123");
    }
  });
});

describe("router (preemptive)", () => {
  const ctx = setupTest();

  let router: H3;

  beforeEach(() => {
    router = createApp()
      .get("/test", () => "Test")
      .get("/undefined", () => undefined);
    ctx.app.all("/**", router);
  });

  it("Handle /test", async () => {
    const res = await ctx.request.get("/test");
    expect(res.text).toEqual("Test");
  });

  it("Handle /404", async () => {
    const res = await ctx.request.get("/404");
    expect(JSON.parse(res.text)).toMatchObject({
      statusCode: 404,
      statusMessage: "Cannot find any route matching [GET] /404",
    });
  });

  it("Not matching route method", async () => {
    const res = await ctx.request.head("/404");
    expect(res.status).toEqual(404);
  });

  it("Handle /undefined", async () => {
    const res = await ctx.request.get("/undefined");
    expect(res.text).toEqual("");
  });
});

describe("getRouterParams", () => {
  const ctx = setupTest();

  describe("with router", () => {
    it("can return router params", async () => {
      const router = createApp().get("/test/params/:name", (event) => {
        expect(getRouterParams(event)).toMatchObject({ name: "string" });
        return "200";
      });
      ctx.app.use(router);
      const result = await ctx.request.get("/test/params/string");

      expect(result.text).toBe("200");
    });

    it("can decode router params", async () => {
      const router = createApp().get("/test/params/:name", (event) => {
        expect(getRouterParams(event, { decode: true })).toMatchObject({
          name: "string with space",
        });
        return "200";
      });
      ctx.app.use(router);
      const result = await ctx.request.get("/test/params/string with space");

      expect(result.text).toBe("200");
    });
  });

  describe("without router", () => {
    it("can return an empty object if router is not used", async () => {
      ctx.app.use("/**", (event) => {
        expect(getRouterParams(event)).toMatchObject({});
        return "200";
      });
      const result = await ctx.request.get("/test/empty/params");

      expect(result.text).toBe("200");
    });
  });
});

describe("getRouterParam", () => {
  const ctx = setupTest();

  describe("with router", () => {
    it("can return a value of router params corresponding to the given name", async () => {
      const router = createApp().get("/test/params/:name", (event) => {
        expect(getRouterParam(event, "name")).toEqual("string");
        return "200";
      });
      ctx.app.use(router);
      const result = await ctx.request.get("/test/params/string");

      expect(result.text).toBe("200");
    });

    it("can decode a value of router params corresponding to the given name", async () => {
      const router = createApp().get("/test/params/:name", (event) => {
        expect(getRouterParam(event, "name", { decode: true })).toEqual(
          "string with space",
        );
        return "200";
      });
      ctx.app.use(router);
      const result = await ctx.request.get("/test/params/string with space");

      expect(result.text).toBe("200");
    });
  });

  describe("without router", () => {
    it("can return `undefined` for any keys", async () => {
      ctx.app.use("/**", (request) => {
        expect(getRouterParam(request, "name")).toEqual(undefined);
        return "200";
      });
      const result = await ctx.request.get("/test/empty/params");

      expect(result.text).toBe("200");
    });
  });
});

describe("event.context.matchedRoute", () => {
  const ctx = setupTest();

  describe("with router", () => {
    it("can return the matched path", async () => {
      const router = createApp().get("/test/:template", (event) => {
        expect(event.context.matchedRoute).toMatchObject({
          method: "GET",
          route: "/test/:template",
          handler: expect.any(Function),
        });
        return "200";
      });
      ctx.app.use(router);
      const result = await ctx.request.get("/test/path");

      expect(result.text).toBe("200");
    });
  });

  describe("without router", () => {
    it("can return `undefined` for matched path", async () => {
      ctx.app.use("/**", (event) => {
        expect(event.context.matchedRoute).toEqual(undefined);
        return "200";
      });
      const result = await ctx.request.get("/test/path");

      expect(result.text).toBe("200");
    });
  });
});
