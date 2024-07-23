import express from "express";
import createConnectApp from "connect";
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString, renderToPipeableStream } from "react-dom/server";
import { fromNodeHandler, defineNodeHandler } from "../src/adapters/node";
import { setupTest } from "./_setup";
import { toNodeHandler } from "../src";

describe.todo("integration with react", () => {
  const ctx = setupTest();

  it("renderToString", async () => {
    ctx.app.use("/", () => {
      const el = createElement("h1", null, `Hello`);
      return renderToString(el);
    });
    const res = await ctx.fetch("/");
    expect(await res.text()).toBe("<h1>Hello</h1>");
  });

  it("renderToPipeableStream", async () => {
    ctx.app.use("/", () => {
      const el = createElement("h1", null, `Hello`);
      return renderToPipeableStream(el);
    });
    const res = await ctx.fetch("/");
    expect(await res.text()).toBe("<h1>Hello</h1>");
  });
});

describe.todo("integration with express", () => {
  const ctx = setupTest();

  it("can wrap an express instance", async () => {
    const expressApp = express();
    expressApp.use("/", (_req, res) => {
      res.json({ express: "works" });
    });
    ctx.app.use("/api/express", fromNodeHandler(expressApp));
    const res = await ctx.fetch("/api/express");

    expect(await res.json()).toEqual({ express: "works" });
  });

  it("can be used as express middleware", async () => {
    const expressApp = express();
    ctx.app.use(
      "/api/*",
      fromNodeHandler((_req, res, next) => {
        (res as any).prop = "42";
        next();
      }),
    );
    ctx.app.use(
      "/api/hello",
      fromNodeHandler(
        defineNodeHandler((req, res) => ({
          url: req.url,
          prop: (res as any).prop,
        })),
      ),
    );
    expressApp.use("/api", toNodeHandler(ctx.app));

    const res = await ctx.fetch("/api/hello");

    expect(await res.json()).toEqual({ url: "/api/hello", prop: "42" });
  });

  it("can wrap a connect instance", async () => {
    const connectApp = createConnectApp();
    connectApp.use("/api/connect", (_req, res) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ connect: "works" }));
    });
    ctx.app.use("/**", fromNodeHandler(connectApp));
    const res = await ctx.fetch("/api/connect");

    expect(await res.json()).toEqual({ connect: "works" });
  });

  it("can be used as connect middleware", async () => {
    const connectApp = createConnectApp();
    ctx.app.use(
      "/api/hello",
      fromNodeHandler((_req, res, next) => {
        (res as any).prop = "42";
        next?.();
      }),
    );
    ctx.app.use(
      "/api/hello",
      fromNodeHandler((req, res) => ({
        url: req.url,
        prop: (res as any).prop,
      })),
    );
    connectApp.use("/api", toNodeHandler(ctx.app));

    const res = await ctx.fetch("/api/hello");

    expect(await res.json()).toEqual({ url: "/api/hello", prop: "42" });
  });
});
