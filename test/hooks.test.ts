import { vi } from "vitest";
import { createError } from "../src";
import { describeMatrix } from "./_setup";

describeMatrix("hooks", (t, { it, expect }) => {
  // TODO: We skip onAfterResponse hooks for web target as we have no control over platform how they handle response
  // It can be shimmed by calling right before returning the response (and possibly integrate with waitUntil)

  it("calls onRequest and onResponse", async () => {
    t.app.use(() => Promise.resolve("Hello World!"));
    await t.fetch("/foo");

    expect(t.hooks.onRequest).toHaveBeenCalledTimes(1);
    expect(t.hooks.onRequest.mock.calls[0]![0]!.path).toBe("/foo");

    expect(t.hooks.onError).toHaveBeenCalledTimes(0);

    expect(t.hooks.onBeforeResponse).toHaveBeenCalledTimes(1);
    expect(t.hooks.onBeforeResponse.mock.calls[0]![1]!.body).toBe(
      "Hello World!",
    );

    if (t.target !== "web") {
      expect(t.hooks.onAfterResponse).toHaveBeenCalledTimes(1);
      expect(t.hooks.onAfterResponse.mock.calls[0]![1]!.body).toBe(
        "Hello World!",
      );
    }
  });

  it("сalls onRequest and onResponse when an exception is thrown", async () => {
    t.app.use(() => {
      throw createError({
        statusCode: 503,
      });
    });
    await t.fetch("/foo");

    expect(t.hooks.onRequest).toHaveBeenCalledTimes(1);
    expect(t.hooks.onRequest.mock.calls[0]![0]!.path).toBe("/foo");

    expect(t.hooks.onError).toHaveBeenCalledTimes(1);
    expect(t.hooks.onError.mock.calls[0]![0]!.statusCode).toBe(503);
    expect(t.hooks.onError.mock.calls[0]![1]!.path).toBe("/foo");

    expect(t.hooks.onBeforeResponse).toHaveBeenCalledTimes(1);

    if (t.target !== "web") {
      expect(t.hooks.onAfterResponse).toHaveBeenCalledTimes(1);
    }
  });

  it("calls onRequest and onResponse when an error is thrown", async () => {
    t.app.use(() => {
      throw createError({
        statusCode: 404,
      });
    });
    await t.fetch("/foo");

    expect(t.hooks.onRequest).toHaveBeenCalledTimes(1);
    expect(t.hooks.onRequest.mock.calls[0]![0]!.path).toBe("/foo");

    expect(t.hooks.onError).toHaveBeenCalledTimes(1);
    expect(t.hooks.onError.mock.calls[0]![0]!.statusCode).toBe(404);
    expect(t.hooks.onError.mock.calls[0]![1]!.path).toBe("/foo");

    expect(t.hooks.onBeforeResponse).toHaveBeenCalledTimes(1);
    if (t.target !== "web") {
      expect(t.hooks.onAfterResponse).toHaveBeenCalledTimes(1);
    }
  });

  it("calls onRequest and onResponse when an unhandled error occurs", async () => {
    t.app.use((event) => {
      // @ts-expect-error
      return event.unknown.property;
    });

    vi.spyOn(console, "error").mockImplementation(() => {});
    await t.fetch("/foo");

    const errors = t.errors;
    t.errors = [];

    expect(errors.length).toBe(1);
    expect(errors[0].statusCode).toBe(500);

    expect(t.hooks.onRequest).toHaveBeenCalledTimes(1);
    expect(t.hooks.onRequest.mock.calls[0][0].path).toBe("/foo");

    expect(t.hooks.onError).toHaveBeenCalledTimes(1);
    expect(t.hooks.onError.mock.calls[0]![0]!.statusCode).toBe(500);
    expect(t.hooks.onError.mock.calls[0]![0]!.cause).toBeInstanceOf(TypeError);
    expect(t.hooks.onError.mock.calls[0]![1]!.path).toBe("/foo");

    expect(t.hooks.onBeforeResponse).toHaveBeenCalledTimes(1);
    if (t.target !== "web") {
      expect(t.hooks.onAfterResponse).toHaveBeenCalledTimes(1);
    }
  });
});
