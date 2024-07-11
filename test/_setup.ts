import type { Mock } from "vitest";
import type { H3, H3Config, H3Error, H3Event } from "../src/types";
import type { PlainHandler } from "../src/types";
import { beforeEach, afterEach, vi } from "vitest";
import supertest from "supertest";
import { Server as NodeServer } from "node:http";
import { Client as UndiciClient } from "undici";
import { getRandomPort } from "get-port-please";
import { createApp, NodeHandler, toNodeHandler, toPlainHandler } from "../src";

interface TestContext {
  request: ReturnType<typeof supertest>;

  nodeHandler: NodeHandler;
  plainHandler: PlainHandler;

  app: H3;

  server?: NodeServer;
  client?: UndiciClient;
  url?: string;

  errors: H3Error[];

  onRequest: Mock<Exclude<H3Config["onRequest"], undefined>>;
  onError: Mock<Exclude<H3Config["onError"], undefined>>;
  onBeforeResponse: Mock<Exclude<H3Config["onBeforeResponse"], undefined>>;
  onAfterResponse: Mock<Exclude<H3Config["onAfterResponse"], undefined>>;
}

export function setupTest(
  opts: { allowUnhandledErrors?: boolean; startServer?: boolean } = {},
) {
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

    ctx.nodeHandler = toNodeHandler(ctx.app);
    ctx.plainHandler = toPlainHandler(ctx.app);

    ctx.request = supertest(ctx.nodeHandler);

    if (opts.startServer) {
      ctx.server = new NodeServer(ctx.nodeHandler);
      const port = await getRandomPort();
      await new Promise<void>((resolve) => ctx.server!.listen(port, resolve));
      ctx.url = `http://localhost:${port}`;
      ctx.client = new UndiciClient(ctx.url);
    }
  });

  afterEach(async () => {
    vi.resetAllMocks();

    if (opts.startServer) {
      await Promise.all([
        ctx.client?.close(),
        new Promise<void>((resolve, reject) =>
          ctx.server?.close((error) => (error ? reject(error) : resolve())),
        ),
      ]).catch(console.error);

      ctx.client = undefined;
      ctx.server = undefined;
      ctx.url = undefined;
    }

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
