import { ReadableStream } from "node:stream/web";
import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createApp,
  App,
  toNodeListener,
  eventHandler,
  sendIterable,
} from "../src";
import { serializeIterableValue } from "../src/utils/internal/iteratable";

describe("", () => {
  let app: App;
  let request: SuperTest<Test>;

  beforeEach(() => {
    app = createApp({ debug: false });
    request = supertest(toNodeListener(app));
  });

  describe("serializeIterableValue", () => {
    const exampleDate: Date = new Date(Date.UTC(2015, 6, 21, 3, 24, 54, 888));
    it.each([
      { value: "Hello, world!", output: "Hello, world!" },
      { value: 123, output: "123" },
      { value: 1n, output: "1" },
      { value: true, output: "true" },
      { value: false, output: "false" },
      { value: undefined, output: undefined },
      { value: null, output: "null" },
      { value: exampleDate, output: JSON.stringify(exampleDate) },
      { value: { field: 1 }, output: '{"field":1}' },
      { value: [1, 2, 3], output: "[1,2,3]" },
      { value: () => {}, output: undefined },
      {
        value: Buffer.from("Hello, world!"),
        output: Buffer.from("Hello, world!"),
      },
      { value: Uint8Array.from([1, 2, 3]), output: Uint8Array.from([1, 2, 3]) },
    ])("$value => $output", ({ value, output }) => {
      const serialized = serializeIterableValue(value);
      expect(serialized).toStrictEqual(output);
    });
  });

  describe("sendIterable", () => {
    it("sends empty body for an empty iterator", async () => {
      app.use(eventHandler((event) => sendIterable(event, [])));
      const result = await request.get("/");
      expect(result.header["content-length"]).toBe("0");
      expect(result.text).toBe("");
    });

    it("concatenates iterated values", async () => {
      app.use(eventHandler((event) => sendIterable(event, ["a", "b", "c"])));
      const result = await request.get("/");
      expect(result.text).toBe("abc");
    });

    describe("iterable support", () => {
      it.each([
        { type: "Array", iterable: ["the-value"] },
        { type: "Set", iterable: new Set(["the-value"]) },
        {
          type: "Map.keys()",
          iterable: new Map([["the-value", "unused"]]).keys(),
        },
        {
          type: "Map.values()",
          iterable: new Map([["unused", "the-value"]]).values(),
        },
        {
          type: "Iterator object",
          iterable: { next: () => ({ value: "the-value", done: true }) },
        },
        {
          type: "AsyncIterator object",
          iterable: {
            next: () => Promise.resolve({ value: "the-value", done: true }),
          },
        },
        {
          type: "Generator (yield)",
          iterable: (function* () {
            yield "the-value";
          })(),
        },
        {
          type: "Generator (return)",
          iterable: (function* () {
            return "the-value";
          })(),
        },
        {
          type: "Generator (yield*)",
          iterable: (function* () {
            yield* ["the-value"];
          })(),
        },
        {
          type: "AsyncGenerator",
          iterable: (async function* () {
            await Promise.resolve();
            yield "the-value";
          })(),
        },
        {
          type: "ReadableStream (push-mode)",
          iterable: new ReadableStream({
            start(controller) {
              controller.enqueue("the-value");
              controller.close();
            },
          }),
        },
        {
          type: "ReadableStream (pull-mode)",
          iterable: new ReadableStream({
            pull(controller) {
              controller.enqueue("the-value");
              controller.close();
            },
          }),
        },
      ])("$type", async ({ iterable }) => {
        app.use(eventHandler((event) => sendIterable(event, iterable)));
        const response = await request.get("/");
        expect(response.text).toBe("the-value");
      });
    });

    describe("serializer argument", () => {
      it("is called for every value", async () => {
        const iterable = [1, "2", { field: 3 }, null];
        const serializer = vi.fn(() => "x");

        app.use(
          eventHandler((event) =>
            sendIterable(event, iterable, { serializer }),
          ),
        );
        const response = await request.get("/");
        expect(response.text).toBe("x".repeat(iterable.length));
        expect(serializer).toBeCalledTimes(4);
        for (const [i, obj] of iterable.entries()) {
          expect.soft(serializer).toHaveBeenNthCalledWith(i + 1, obj);
        }
      });
    });
  });
});
