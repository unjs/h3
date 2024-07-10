import { describe, it, expect } from "vitest";
import { createApp, defineLazyEventHandler, useBase } from "../src";

describe("Event handler resolver", async () => {
  const _handlers = Object.create(null);
  const _h = (name: string) => {
    if (!_handlers[name]) {
      _handlers[name] = { [name]: () => name }[name];
    }
    return _handlers[name];
  };

  const app = createApp();

  // Middleware
  app.use("/", _h("root middleware"));
  app.use("/**", _h("/**"));

  // Path prefix
  app.use("/test/**", _h("/test/**"));
  app.use(
    "/lazy",
    defineLazyEventHandler(() => _h("lazy")),
  );

  // Sub app
  const nestedApp = createApp();
  nestedApp.use("/path/**", _h("/nested/path/**"));
  nestedApp.use(
    "/lazy",
    defineLazyEventHandler(() => Promise.resolve(_h("/nested/lazy"))),
  );
  app.use("/nested/**", useBase("/nested", nestedApp.handler));

  // Router
  const router = createApp();
  router.get("/", _h("/router"));
  router.get("/:id", _h("/router/:id"));
  router.get(
    "/lazy",
    defineLazyEventHandler(() => Promise.resolve(_h("/router/lazy"))),
  );
  app.use("/router/**", useBase("/router", router.handler));

  describe("middleware", () => {
    it("resolves /", async () => {
      expect(await app.resolve("GET", "/")).toMatchObject({
        handler: _h("root middleware"),
      });
    });

    it("resolves /foo/bar", async () => {
      expect(await app.resolve("GET", "/foo/bar")).toMatchObject({
        route: "/**",
        handler: _h("/**"),
      });
    });
  });

  describe("path prefix", () => {
    it("resolves /test", async () => {
      expect(await app.resolve("GET", "/test")).toMatchObject({
        route: "/test/**",
        handler: _h("/test/**"),
      });
    });

    it("resolves /test/foo", async () => {
      expect(await app.resolve("GET", "/test/foo")).toMatchObject({
        route: "/test/**",
        handler: _h("/test/**"),
      });
    });
  });

  it("resolves /lazy", async () => {
    expect(await app.resolve("GET", "/lazy")).toMatchObject({
      route: "/lazy",
      handler: _h("lazy"),
    });
  });

  describe("nested app", () => {
    it("resolves /nested/path/foo", async () => {
      expect(await app.resolve("GET", "/nested/path/foo")).toMatchObject({
        route: "/nested/path/**",
        handler: _h("/nested/path/**"),
      });
    });

    it("resolves /nested/lazy", async () => {
      expect(await app.resolve("GET", "/nested/lazy")).toMatchObject({
        route: "/nested/lazy",
        handler: _h("/nested/lazy"),
      });
    });
  });

  describe("router", () => {
    it("resolves /router", async () => {
      expect(await app.resolve("GET", "/router")).toMatchObject({
        route: "/router",
        handler: _h("/router"),
      });
      expect(await app.resolve("GET", "/router/")).toMatchObject(
        (await app.resolve("GET", "/router")) as any,
      );
    });

    it("resolves /router/:id", async () => {
      expect(await app.resolve("GET", "/router/foo")).toMatchObject({
        route: "/router/:id",
        handler: _h("/router/:id"),
      });
    });

    it("resolves /router/lazy", async () => {
      expect(await app.resolve("GET", "/router/lazy")).toMatchObject({
        route: "/router/lazy",
        handler: _h("/router/lazy"),
      });
    });
  });
});
