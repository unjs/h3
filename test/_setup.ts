import type { Mock } from "vitest";
import type { H3, H3Config, H3Error, H3Event } from "../src/types";
import { beforeEach, afterEach, vi } from "vitest";
import { Server as NodeServer } from "node:http";
import { getRandomPort } from "get-port-please";
import { createH3, toNodeHandler } from "../src";

interface TestContext {
  errors: H3Error[];
  onRequest: Mock<Exclude<H3Config["onRequest"], undefined>>;
  onError: Mock<Exclude<H3Config["onError"], undefined>>;
  onBeforeResponse: Mock<Exclude<H3Config["onBeforeResponse"], undefined>>;
  onAfterResponse: Mock<Exclude<H3Config["onAfterResponse"], undefined>>;

  server?: NodeServer;
  url?: string;

  app: H3;
  fetch: (
    input: Request | URL | string,
    init?: RequestInit,
  ) => Response | Promise<Response>;
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

    ctx.app = createH3({
      debug: true,
      onError: ctx.onError,
      onRequest: ctx.onRequest,
      onBeforeResponse: ctx.onBeforeResponse,
      onAfterResponse: ctx.onAfterResponse,
    });

    ctx.fetch = ctx.app.fetch.bind(ctx.app);

    if (opts.startServer) {
      ctx.server = new NodeServer(toNodeHandler(ctx.app));
      const port = await getRandomPort();
      await new Promise<void>((resolve) => ctx.server!.listen(port, resolve));
      ctx.url = `http://localhost:${port}`;
    }
  });

  afterEach(async () => {
    vi.resetAllMocks();
    if (!opts.allowUnhandledErrors) {
      const unhandledErrors = ctx.errors.filter(
        (error) => error.unhandled !== false,
      );
      if (unhandledErrors.length > 0) {
        throw _mergeErrors(ctx.errors);
      }
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
