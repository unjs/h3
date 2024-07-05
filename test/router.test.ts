import type { Router } from "../src/types";
import { describe, it, expect, beforeEach } from "vitest";
import {
  createRouter,
  getRouterParams,
  getRouterParam,
  eventHandler,
} from "../src";
import { setupTest } from "./_setup";

describe("router", () => {
  const ctx = setupTest();

  let router: Router;

  beforeEach(() => {
    router = createRouter()
      .add(
        "/",
        eventHandler(() => "Hello"),
      )
      .add(
        "/test/?/a",
        eventHandler(() => "/test/?/a"),
      )
      .add(
        "/many/routes",
        eventHandler(() => "many routes"),
        ["get", "post"],
      )
      .get(
        "/test",
        eventHandler(() => "Test (GET)"),
      )
      .post(
        "/test",
        eventHandler(() => "Test (POST)"),
      );

    ctx.app.use(router);
  });

  it("Handle route", async () => {
    const res = await ctx.request.get("/");
    expect(res.text).toEqual("Hello");
  });

  it("Multiple Routers", async () => {
    const secondRouter = createRouter().add(
      "/router2",
      eventHandler(() => "router2"),
    );

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
    router.post(
      "/test/123",
      eventHandler((event) => `[${event.method}] ${event.path}`),
    );

    router.use(
      "/test/**",
      eventHandler((event) => `[${event.method}] ${event.path}`),
    );

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

  let router: Router;

  beforeEach(() => {
    router = createRouter({ preemptive: true })
      .get(
        "/test",
        eventHandler(() => "Test"),
      )
      .get(
        "/undefined",
        eventHandler(() => undefined),
      );
    ctx.app.use(router);
  });

  it("Handle /test", async () => {
    const res = await ctx.request.get("/test");
    expect(res.text).toEqual("Test");
  });

  it("Handle /404", async () => {
    const res = await ctx.request.get("/404");
    expect(JSON.parse(res.text)).toMatchObject({
      statusCode: 404,
      statusMessage: "Cannot find any route matching [get] /404.",
    });
  });

  it("Not matching route method", async () => {
    const res = await ctx.request.head("/test");
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
      const router = createRouter().get(
        "/test/params/:name",
        eventHandler((event) => {
          expect(getRouterParams(event)).toMatchObject({ name: "string" });
          return "200";
        }),
      );
      ctx.app.use(router);
      const result = await ctx.request.get("/test/params/string");

      expect(result.text).toBe("200");
    });

    it("can decode router params", async () => {
      const router = createRouter().get(
        "/test/params/:name",
        eventHandler((event) => {
          expect(getRouterParams(event, { decode: true })).toMatchObject({
            name: "string with space",
          });
          return "200";
        }),
      );
      ctx.app.use(router);
      const result = await ctx.request.get("/test/params/string with space");

      expect(result.text).toBe("200");
    });
  });

  describe("without router", () => {
    it("can return an empty object if router is not used", async () => {
      ctx.app.use(
        "/",
        eventHandler((event) => {
          expect(getRouterParams(event)).toMatchObject({});
          return "200";
        }),
      );
      const result = await ctx.request.get("/test/empty/params");

      expect(result.text).toBe("200");
    });
  });
});

describe("getRouterParam", () => {
  const ctx = setupTest();

  describe("with router", () => {
    it("can return a value of router params corresponding to the given name", async () => {
      const router = createRouter().get(
        "/test/params/:name",
        eventHandler((event) => {
          expect(getRouterParam(event, "name")).toEqual("string");
          return "200";
        }),
      );
      ctx.app.use(router);
      const result = await ctx.request.get("/test/params/string");

      expect(result.text).toBe("200");
    });

    it("can decode a value of router params corresponding to the given name", async () => {
      const router = createRouter().get(
        "/test/params/:name",
        eventHandler((event) => {
          expect(getRouterParam(event, "name", { decode: true })).toEqual(
            "string with space",
          );
          return "200";
        }),
      );
      ctx.app.use(router);
      const result = await ctx.request.get("/test/params/string with space");

      expect(result.text).toBe("200");
    });
  });

  describe("without router", () => {
    it("can return `undefined` for any keys", async () => {
      ctx.app.use(
        "/",
        eventHandler((request) => {
          expect(getRouterParam(request, "name")).toEqual(undefined);
          return "200";
        }),
      );
      const result = await ctx.request.get("/test/empty/params");

      expect(result.text).toBe("200");
    });
  });
});

describe("event.context.matchedRoute", () => {
  const ctx = setupTest();

  describe("with router", () => {
    it("can return the matched path", async () => {
      const router = createRouter().get(
        "/test/:template",
        eventHandler((event) => {
          expect(event.context.matchedRoute).toMatchObject({
            path: "/test/:template",
          });
          return "200";
        }),
      );
      ctx.app.use(router);
      const result = await ctx.request.get("/test/path");

      expect(result.text).toBe("200");
    });
  });

  describe("without router", () => {
    it("can return `undefined` for matched path", async () => {
      ctx.app.use(
        "/",
        eventHandler((event) => {
          expect(event.context.matchedRoute).toEqual(undefined);
          return "200";
        }),
      );
      const result = await ctx.request.get("/test/path");

      expect(result.text).toBe("200");
    });
  });
});
