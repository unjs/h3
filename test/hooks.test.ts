import { describe, it, expect, vi } from "vitest";
import { createError } from "../src";
import { setupTest } from "./_setup";

describe.todo("app hooks", () => {
  const ctx = setupTest();

  it("calls onRequest and onResponse", async () => {
    ctx.app.use(() => Promise.resolve("Hello World!"));
    await ctx.fetch("/foo");

    expect(ctx.onRequest).toHaveBeenCalledTimes(1);
    expect(ctx.onRequest.mock.calls[0]![0]!.path).toBe("/foo");

    expect(ctx.onError).toHaveBeenCalledTimes(0);

    expect(ctx.onBeforeResponse).toHaveBeenCalledTimes(1);
    expect(ctx.onBeforeResponse.mock.calls[0]![1]!.body).toBe("Hello World!");

    expect(ctx.onAfterResponse).toHaveBeenCalledTimes(1);
    expect(ctx.onAfterResponse.mock.calls[0]![1]!.body).toBe("Hello World!");
  });

  it("сalls onRequest and onResponse when an exception is thrown", async () => {
    ctx.app.use(() => {
      throw createError({
        statusCode: 503,
      });
    });
    await ctx.fetch("/foo");

    expect(ctx.onRequest).toHaveBeenCalledTimes(1);
    expect(ctx.onRequest.mock.calls[0]![0]!.path).toBe("/foo");

    expect(ctx.onError).toHaveBeenCalledTimes(1);
    expect(ctx.onError.mock.calls[0]![0]!.statusCode).toBe(503);
    expect(ctx.onError.mock.calls[0]![1]!.path).toBe("/foo");

    expect(ctx.onBeforeResponse).toHaveBeenCalledTimes(1);
    expect(ctx.onAfterResponse).toHaveBeenCalledTimes(1);
  });

  it("calls onRequest and onResponse when an error is thrown", async () => {
    ctx.app.use(() => {
      throw createError({
        statusCode: 404,
      });
    });
    await ctx.fetch("/foo");

    expect(ctx.onRequest).toHaveBeenCalledTimes(1);
    expect(ctx.onRequest.mock.calls[0]![0]!.path).toBe("/foo");

    expect(ctx.onError).toHaveBeenCalledTimes(1);
    expect(ctx.onError.mock.calls[0]![0]!.statusCode).toBe(404);
    expect(ctx.onError.mock.calls[0]![1]!.path).toBe("/foo");

    expect(ctx.onBeforeResponse).toHaveBeenCalledTimes(1);
    expect(ctx.onAfterResponse).toHaveBeenCalledTimes(1);
  });

  it("calls onRequest and onResponse when an unhandled error occurs", async () => {
    ctx.app.use((event) => {
      // @ts-expect-error
      return event.unknown.property;
    });

    vi.spyOn(console, "error").mockImplementation(() => {});
    await ctx.fetch("/foo");

    const errors = ctx.errors;
    ctx.errors = [];

    expect(errors.length).toBe(1);
    expect(errors[0].statusCode).toBe(500);

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
