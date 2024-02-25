import { describe, it, expect } from "vitest";
import { createApp, createRouter, eventHandler } from "../src";

describe("Event handler resolver", () => {
  const testHandlers = Array.from({ length: 10 }).map((_, i) =>
    eventHandler(() => i),
  );

  const app = createApp();

  const router = createRouter();
  app.use(router);

  // Middlware
  app.use(testHandlers[0]);
  app.use("/", testHandlers[1]);

  // Path prefix
  app.use("/test", testHandlers[2]);
  app.use("/lazy", () => testHandlers[3], { lazy: true });

  // Sub app
  const app2 = createApp();
  app.use("/foo", app2 as any);
  app2.use("/bar", testHandlers[4]);

  // Router
  router.get("/router", testHandlers[5]);
  router.get("/router/:id", testHandlers[6]);

  describe("middleware", () => {
    it("does not resolves /", async () => {
      expect(await app.resolve("/")).toBeUndefined();
    });
  });

  describe("path prefix", () => {
    it("resolves /test", async () => {
      expect(await app.resolve("/test")).toMatchObject({
        route: "/test",
        handler: testHandlers[2],
      });
    });

    it("resolves /test/foo", async () => {
      expect((await app.resolve("/test/foo"))?.route).toEqual("/test");
    });
  });

  it("resolves /lazy", async () => {
    expect(await app.resolve("/lazy")).toMatchObject({
      route: "/lazy",
      handler: testHandlers[3],
    });
  });

  describe("nested app", () => {
    it("resolves /foo/bar/baz", async () => {
      expect(await app.resolve("/foo/bar/baz")).toMatchObject({
        route: "/foo/bar",
        handler: testHandlers[4],
      });
    });
  });

  describe("router", () => {
    it("resolves /router", async () => {
      expect(await app.resolve("/router")).toMatchObject({
        route: "/router",
        handler: testHandlers[5],
      });
      expect(await app.resolve("/router/")).toMatchObject(
        (await app.resolve("/router")) as any,
      );
    });

    it("resolves /router/:id", async () => {
      expect(await app.resolve("/router/foo")).toMatchObject({
        route: "/router/:id",
        handler: testHandlers[6],
      });
    });
  });
});
