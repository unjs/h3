import { expect } from "vitest";
import { createRouter, eventHandler } from "../../src";
import { serverLambda } from "../minimal-server";

// Basic server with routes
await serverLambda(async (app) => {
  const router = createRouter();
  // Make sure eventHandler is wrapped around
  router.get("/", eventHandler((event) => {
    return "Hello World!";
  }));

  app.use("/api", router);

  const r = await fetch("http://localhost:3000/api/").then(t => t.text());
  expect(r).to.be("Hello World!");
});

// Example using
