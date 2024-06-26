import express from "express";
import createConnectApp from "connect";
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString, renderToPipeableStream } from "react-dom/server";
import { fromNodeHandler, defineNodeHandler } from "../src/adapters/node";
import { eventHandler } from "../src";
import { setupTest } from "./_setup";

describe("integration with react", () => {
  const ctx = setupTest();

  it("renderToString", async () => {
    ctx.app.use(
      "/",
      eventHandler(() => {
        const el = createElement("h1", null, `Hello`);
        return renderToString(el);
      }),
    );
    const res = await ctx.request.get("/");
    expect(res.text).toBe("<h1>Hello</h1>");
  });

  it("renderToPipeableStream", async () => {
    ctx.app.use(
      "/",
      eventHandler(() => {
        const el = createElement("h1", null, `Hello`);
        return renderToPipeableStream(el);
      }),
    );
    const res = await ctx.request.get("/");
    expect(res.text).toBe("<h1>Hello</h1>");
  });
});

describe("integration with express", () => {
  const ctx = setupTest();

  it("can wrap an express instance", async () => {
    const expressApp = express();
    expressApp.use("/", (_req, res) => {
      res.json({ express: "works" });
    });
    ctx.app.use("/api/express", fromNodeHandler(expressApp));
    const res = await ctx.request.get("/api/express");

    expect(res.body).toEqual({ express: "works" });
  });

  it("can be used as express middleware", async () => {
    const expressApp = express();
    ctx.app.use(
      "/api/hello",
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
    expressApp.use("/api", ctx.nodeHandler);

    const res = await ctx.request.get("/api/hello");

    expect(res.body).toEqual({ url: "/", prop: "42" });
  });

  it("can wrap a connect instance", async () => {
    const connectApp = createConnectApp();
    connectApp.use("/api/connect", (_req, res) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ connect: "works" }));
    });
    ctx.app.use("/", fromNodeHandler(connectApp));
    const res = await ctx.request.get("/api/connect");

    expect(res.body).toEqual({ connect: "works" });
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
    connectApp.use("/api", ctx.nodeHandler);

    const res = await ctx.request.get("/api/hello");

    expect(res.body).toEqual({ url: "/", prop: "42" });
  });
});
