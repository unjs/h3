import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createApp,
  App,
  createError,
  toNodeListener,
  eventHandler,
  H3Error,
} from "../src";

const consoleMock = ((global.console.error as any) = vi.fn());

describe("error", () => {
  let app: App;
  let request: SuperTest<Test>;

  const capturedErrors: H3Error[] = [];

  beforeEach(() => {
    app = createApp({
      debug: false,
      onError(error) {
        capturedErrors.push(error);
      },
    });
    request = supertest(toNodeListener(app));
  });

  afterEach(() => {
    capturedErrors.length = 0;
  });

  it("logs errors", async () => {
    app.use(
      eventHandler(() => {
        throw createError({ statusMessage: "Unprocessable", statusCode: 422 });
      })
    );
    const result = await request.get("/");

    expect(result.status).toBe(422);
  });

  it("returns errors", async () => {
    app.use(
      eventHandler(() => {
        throw createError({ statusMessage: "Unprocessable", statusCode: 422 });
      })
    );
    const result = await request.get("/");

    expect(result.status).toBe(422);
  });

  it("can send internal error", async () => {
    app.use(
      "/",
      eventHandler(() => {
        throw new Error("Booo");
      })
    );
    const result = await request.get("/api/test");

    expect(result.status).toBe(500);
    expect(JSON.parse(result.text)).toMatchObject({
      statusCode: 500,
    });
  });

  it("can send runtime error", async () => {
    consoleMock.mockReset();

    app.use(
      "/",
      eventHandler(() => {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            message: "Invalid Input",
          },
        });
      })
    );

    const result = await request.get("/api/test");

    expect(result.status).toBe(400);
    expect(result.type).toMatch("application/json");

    expect(console.error).not.toBeCalled();

    expect(JSON.parse(result.text)).toMatchObject({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        message: "Invalid Input",
      },
    });
  });

  it("can handle errors in promises", async () => {
    app.use(
      "/",
      eventHandler(() => {
        throw new Error("failed");
      })
    );

    const res = await request.get("/");
    expect(res.status).toBe(500);
  });

  it("can handle returned Error", async () => {
    app.use(
      "/",
      eventHandler(() => new Error("failed"))
    );

    const res = await request.get("/");
    expect(res.status).toBe(500);
  });

  it("can handle returned H3Error", async () => {
    app.use(
      "/",
      eventHandler(() => createError({ statusCode: 501 }))
    );

    const res = await request.get("/");
    expect(res.status).toBe(501);
  });

  it("can access original error", async () => {
    class CustomError extends Error {
      customError: true;
    }

    app.use(
      "/",
      eventHandler(() => {
        throw createError(new CustomError());
      })
    );

    const res = await request.get("/");
    expect(res.status).toBe(500);

    expect(capturedErrors[0].cause).toBeInstanceOf(CustomError);
  });
});
