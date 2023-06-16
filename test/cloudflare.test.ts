/// <reference types="vitest-environment-miniflare/globals" />

import { expect, test } from "vitest";
import worker from "./h3-worker";

const env = getMiniflareBindings();
const ctx = new ExecutionContext();

const baseUrl = "http://localhost";

test("responds with url", async () => {
  const request = new Request(baseUrl);
  const response = await worker.fetch(request, env, ctx);
  expect(await response.text()).toBe(`Hello world ! ${baseUrl}/`);
});

test("Can use the router", async () => {
  const request = new Request(`${baseUrl}/here`);
  const response = await worker.fetch(request, env, ctx);
  expect(await response.text()).toBe(`Routed there`);
});
