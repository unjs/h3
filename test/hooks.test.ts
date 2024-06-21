import { describe, it, expect, vi } from "vitest";
import { eventHandler, createError } from "../src";
import { setupTest } from "./_utils";

describe("app", () => {
  const ctx = setupTest();

  it("calls onRequest and onResponse", async () => {
    ctx.app.use(eventHandler(() => Promise.resolve("Hello World!")));
    await ctx.request.get("/foo");

    expect(ctx.onRequest).toHaveBeenCalledTimes(1);
    expect(ctx.onRequest.mock.calls[0]![0]!.path).toBe("/foo");

    expect(ctx.onError).toHaveBeenCalledTimes(0);

    expect(ctx.onBeforeResponse).toHaveBeenCalledTimes(1);
    expect(ctx.onBeforeResponse.mock.calls[0]![1]!.body).toBe("Hello World!");

    expect(ctx.onAfterResponse).toHaveBeenCalledTimes(1);
    expect(ctx.onAfterResponse.mock.calls[0]![1]!.body).toBe("Hello World!");
  });

  it("сalls onRequest and onResponse when an exception is thrown", async () => {
    ctx.app.use(
      eventHandler(() => {
        throw createError({
          statusCode: 503,
        });
      }),
    );
    await ctx.request.get("/foo");

    expect(ctx.onRequest).toHaveBeenCalledTimes(1);
    expect(ctx.onRequest.mock.calls[0]![0]!.path).toBe("/foo");

    expect(ctx.onError).toHaveBeenCalledTimes(1);
    expect(ctx.onError.mock.calls[0]![0]!.statusCode).toBe(503);
    expect(ctx.onError.mock.calls[0]![1]!.path).toBe("/foo");

    expect(ctx.onBeforeResponse).toHaveBeenCalledTimes(1);
    expect(ctx.onAfterResponse).toHaveBeenCalledTimes(1);
  });

  it("calls onRequest and onResponse when an error is returned", async () => {
    ctx.app.use(
      eventHandler(() => {
        return createError({
          statusCode: 404,
        });
      }),
    );
    await ctx.request.get("/foo");

    expect(ctx.onRequest).toHaveBeenCalledTimes(1);
    expect(ctx.onRequest.mock.calls[0]![0]!.path).toBe("/foo");

    expect(ctx.onError).toHaveBeenCalledTimes(1);
    expect(ctx.onError.mock.calls[0]![0]!.statusCode).toBe(404);
    expect(ctx.onError.mock.calls[0]![1]!.path).toBe("/foo");

    expect(ctx.onBeforeResponse).toHaveBeenCalledTimes(1);
    expect(ctx.onAfterResponse).toHaveBeenCalledTimes(1);
  });

  it("calls onRequest and onResponse when an unhandled error occurs", async () => {
    ctx.app.use(
      eventHandler((event) => {
        // @ts-expect-error
        return event.unknown.property;
      }),
    );

    vi.spyOn(console, "error").mockImplementation(() => {});
    await ctx.request.get("/foo");

    expect(ctx.errors.length).toBe(1);
    expect(ctx.errors[0].statusCode).toBe(500);
    ctx.errors = [];

    expect(ctx.onRequest).toHaveBeenCalledTimes(1);
    expect(ctx.onRequest.mock.calls[0][0].path).toBe("/foo");

    expect(ctx.onError).toHaveBeenCalledTimes(1);
    expect(ctx.onError.mock.calls[0]![0]!.statusCode).toBe(500);
    expect(ctx.onError.mock.calls[0]![0]!.cause).toBeInstanceOf(TypeError);
    expect(ctx.onError.mock.calls[0]![1]!.path).toBe("/foo");

    expect(ctx.onBeforeResponse).toHaveBeenCalledTimes(1);
    expect(ctx.onAfterResponse).toHaveBeenCalledTimes(1);
  });
});
