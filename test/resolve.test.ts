import { describe, it, expect } from "vitest";
import { createApp, createRouter, defineLazyEventHandler } from "../src";

describe("Event handler resolver", () => {
  const testHandlers = Array.from({ length: 10 }).map((_, i) => () => i);

  const app = createApp();

  const router = createRouter();
  app.use(router);

  // Middleware
  app.use(testHandlers[0]);
  app.use("/", testHandlers[1]);

  // Path prefix
  app.use("/test", testHandlers[2]);
  app.use("/lazy", () => testHandlers[3], { lazy: true });

  // Sub app
  const app2 = createApp();
  app.use("/nested", app2 as any);
  app2.use("/path", testHandlers[4]);
  // app2.use("/lazy", () => testHandlers[5], { lazy: true });

  // Router
  router.get("/router", testHandlers[6]);
  router.get("/router/:id", testHandlers[7]);
  router.get(
    "/router/lazy",
    defineLazyEventHandler(() => testHandlers[8]),
  );

  describe("middleware", () => {
    it("does not resolves /", async () => {
      expect(await app.resolve("GET", "/")).toBeUndefined();
    });
  });

  describe("path prefix", () => {
    it("resolves /test", async () => {
      expect(await app.resolve("GET", "/test")).toMatchObject({
        route: "/test",
        handler: testHandlers[2],
      });
    });

    it("resolves /test/foo", async () => {
      expect((await app.resolve("GET", "/test/foo"))?.route).toEqual("/test");
    });
  });

  it("resolves /lazy", async () => {
    expect(await app.resolve("GET", "/lazy")).toMatchObject({
      route: "/lazy",
      handler: testHandlers[3],
    });
  });

  describe("nested app", () => {
    it("resolves /nested/path/foo", async () => {
      expect(await app.resolve("GET", "/nested/path/foo")).toMatchObject({
        route: "/nested/path",
        handler: testHandlers[4],
      });
    });

    it.skip("resolves /nested/lazy", async () => {
      expect(await app.resolve("GET", "/nested/lazy")).toMatchObject({
        route: "/nested/lazy",
        handler: testHandlers[5],
      });
    });
  });

  describe("router", () => {
    it("resolves /router", async () => {
      expect(await app.resolve("GET", "/router")).toMatchObject({
        route: "/router",
        handler: testHandlers[6],
      });
      expect(await app.resolve("GET", "/router/")).toMatchObject(
        (await app.resolve("GET", "/router")) as any,
      );
    });

    it("resolves /router/:id", async () => {
      expect(await app.resolve("GET", "/router/foo")).toMatchObject({
        route: "/router/:id",
        handler: testHandlers[7],
      });
    });

    it("resolves /router/lazy", async () => {
      expect(await app.resolve("GET", "/router/lazy")).toMatchObject({
        route: "/router/lazy",
        handler: testHandlers[8],
      });
    });
  });
});
