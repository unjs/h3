import { describe, it, expect } from "vitest";
import { createApp, createRouter, defineLazyEventHandler } from "../src";

describe("Event handler resolver", () => {
  const testHandlers = Array.from({ length: 10 }).map((_, i) => () => i);

  const app = createApp();

  // Middleware
  app.use(testHandlers[0]);
  app.use("/", testHandlers[1]);

  // Path prefix
  app.use("/test", testHandlers[2]);
  app.use(
    "/lazy",
    defineLazyEventHandler(() => testHandlers[3]),
  );

  // Sub app
  const nestedApp = createApp();
  app.use("/nested", nestedApp as any);
  nestedApp.use("/path", testHandlers[4]);
  nestedApp.use(
    "/lazy",
    defineLazyEventHandler(() => Promise.resolve(testHandlers[5])),
  );

  // Router
  const router = createRouter();
  app.use("/router", router.handler);
  router.get("/", testHandlers[6]);
  router.get("/:id", testHandlers[7]);
  router.get(
    "/lazy",
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
        prefix: "/test",
        handler: testHandlers[2],
      });
    });

    it("resolves /test/foo", async () => {
      expect((await app.resolve("GET", "/test/foo"))?.prefix).toEqual("/test");
    });
  });

  it("resolves /lazy", async () => {
    expect(await app.resolve("GET", "/lazy")).toMatchObject({
      prefix: "/lazy",
      handler: testHandlers[3],
    });
  });

  describe("nested app", () => {
    it("resolves /nested/path/foo", async () => {
      expect(await app.resolve("GET", "/nested/path/foo")).toMatchObject({
        prefix: "/nested/path",
        handler: testHandlers[4],
      });
    });

    it("resolves /nested/lazy", async () => {
      expect(await app.resolve("GET", "/nested/lazy")).toMatchObject({
        prefix: "/nested/lazy",
        handler: testHandlers[5],
      });
    });
  });

  describe("router", () => {
    it("resolves /router", async () => {
      expect(await app.resolve("GET", "/router")).toMatchObject({
        prefix: "/router",
        route: "/",
        handler: testHandlers[6],
      });
      expect(await app.resolve("GET", "/router/")).toMatchObject(
        (await app.resolve("GET", "/router")) as any,
      );
    });

    it("resolves /router/:id", async () => {
      expect(await app.resolve("GET", "/router/foo")).toMatchObject({
        prefix: "/router",
        route: "/:id",
        handler: testHandlers[7],
      });
    });

    it("resolves /router/lazy", async () => {
      expect(await app.resolve("GET", "/router/lazy")).toMatchObject({
        prefix: "/router",
        route: "/lazy",
        handler: testHandlers[8],
      });
    });
  });
});
