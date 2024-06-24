import type { Mock } from "vitest";
import type { App, AppOptions, H3Error, H3Event } from "../src/types";

import { beforeEach, afterEach, vi } from "vitest";
import supertest from "supertest";
import { Server as NodeServer } from "node:http";
import { Client as UndiciClient } from "undici";
import { getRandomPort } from "get-port-please";
import { createApp } from "../src";
import { NodeHandler, toNodeHandler } from "../src/adapters/node";
import { toPlainHandler, toWebHandler } from "../src/adapters/web";
import type { PlainHandler, WebHandler } from "../src/types";

interface TestContext {
  request: ReturnType<typeof supertest>;
  webHandler: WebHandler;
  nodeHandler: NodeHandler;
  plainHandler: PlainHandler;
  server: NodeServer;
  client: UndiciClient;
  url: string;
  app: App;

  errors: H3Error[];

  onRequest: Mock<Parameters<Exclude<AppOptions["onRequest"], undefined>>>;
  onError: Mock<Parameters<Exclude<AppOptions["onError"], undefined>>>;
  onBeforeResponse: Mock<
    Parameters<Exclude<AppOptions["onBeforeResponse"], undefined>>
  >;
  onAfterResponse: Mock<
    Parameters<Exclude<AppOptions["onAfterResponse"], undefined>>
  >;
}

export function setupTest(opts: { allowUnhandledErrors?: boolean } = {}) {
  const ctx: TestContext = {} as TestContext;

  beforeEach(async () => {
    ctx.onRequest = vi.fn();
    ctx.onBeforeResponse = vi.fn();
    ctx.onAfterResponse = vi.fn();
    ctx.errors = [];
    ctx.onError = vi.fn((error, _event: H3Event) => {
      ctx.errors.push(error);
    });

    ctx.app = createApp({
      debug: true,
      onError: ctx.onError,
      onRequest: ctx.onRequest,
      onBeforeResponse: ctx.onBeforeResponse,
      onAfterResponse: ctx.onAfterResponse,
    });

    ctx.webHandler = toWebHandler(ctx.app);
    ctx.nodeHandler = toNodeHandler(ctx.app);
    ctx.plainHandler = toPlainHandler(ctx.app);

    ctx.request = supertest(ctx.nodeHandler);

    ctx.server = new NodeServer(ctx.nodeHandler);
    const port = await getRandomPort();
    await new Promise<void>((resolve) => ctx.server.listen(port, resolve));
    ctx.url = `http://localhost:${port}`;
    ctx.client = new UndiciClient(ctx.url);
  });

  afterEach(async () => {
    vi.resetAllMocks();

    await Promise.all([
      ctx.client.close(),
      new Promise<void>((resolve, reject) =>
        ctx.server.close((error) => (error ? reject(error) : resolve())),
      ),
    ]).catch(console.error);

    if (opts.allowUnhandledErrors) {
      return;
    }
    const unhandledErrors = ctx.errors.filter(
      (error) => error.unhandled !== false,
    );
    if (unhandledErrors.length > 0) {
      throw _mergeErrors(ctx.errors);
    }
  });

  return ctx;
}

function _mergeErrors(err: Error | Error[]) {
  if (Array.isArray(err)) {
    if (err.length === 1) {
      return _mergeErrors(err[0]);
    }
    return new Error(
      "[tests] H3 global errors: \n" +
        err.map((error) => " - " + (error.stack || "")).join("\n"),
    );
  }
  return new Error("[tests] H3 global error: " + (err.stack || ""));
}
