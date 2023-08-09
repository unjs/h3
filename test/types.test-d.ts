import { describe, it, expectTypeOf } from "vitest";
import type { QueryObject } from "ufo";
import {
  eventHandler,
  H3Event,
  getQuery,
  readBody,
  readValidatedBody,
  getValidatedQuery,
  validateEvent,
} from "../src";

describe("types", () => {
  describe("eventHandler", () => {
    it("object syntax definitions", async () => {
      const handler = eventHandler({
        before: [
          (event) => {
            expectTypeOf(event).toEqualTypeOf<H3Event>();
          },
        ],
        async handler(event) {
          expectTypeOf(event).toEqualTypeOf<H3Event>();

          const body = await readBody(event);
          // TODO: Default to unknown in next major version
          expectTypeOf(body).toBeAny();

          return {
            foo: "bar",
          };
        },
      });
      expectTypeOf(await handler({} as H3Event)).toEqualTypeOf<{
        foo: string;
      }>();
    });

    it("return type (inferred)", () => {
      const handler = eventHandler(() => {
        return {
          foo: "bar",
        };
      });
      const response = handler({} as H3Event);
      expectTypeOf(response).toEqualTypeOf<{ foo: string }>();
    });

    it("return type (simple generic)", () => {
      const handler = eventHandler<string>(() => {
        return "";
      });
      const response = handler({} as H3Event);
      expectTypeOf(response).toEqualTypeOf<string>();
    });

    it("inferred validation", async () => {
      const handler = eventHandler({
        async validate(event) {
          await Promise.resolve();
          expectTypeOf(event).toEqualTypeOf<H3Event>();
          return event as H3Event<{ body: { id: string } }>;
        },
        async handler(event) {
          expectTypeOf(event).toEqualTypeOf<
            H3Event<{ body: { id: string } }>
          >();

          const body = await readBody(event);
          expectTypeOf(body).toEqualTypeOf<{ id: string }>();

          return { foo: "bar" };
        },
      });
      expectTypeOf(await handler({} as H3Event)).toEqualTypeOf<{
        foo: string;
      }>();
    });
  });

  describe("validateEvent", () => {
    it("inferred validation", () => {
      eventHandler(async (_event) => {
        const event = await validateEvent(_event, async (event) => {
          await Promise.resolve();
          expectTypeOf(event).toEqualTypeOf<H3Event>();
          return event as H3Event<{ body: { id: string } }>;
        });
        expectTypeOf(event).toEqualTypeOf<H3Event<{ body: { id: string } }>>();
      });
    });

    it("inferred validation without H3Event type requirement", async () => {
      const handler = eventHandler({
        async validate(event) {
          await Promise.resolve();
          expectTypeOf(event).toEqualTypeOf<H3Event>();
          return {} as { body: { id: string } }
        },
        async handler(event) {
          expectTypeOf(event).toEqualTypeOf<
            H3Event<{ body: { id: string } }>
          >();

          const body = await readBody(event);
          expectTypeOf(body).toEqualTypeOf<{ id: string }>();

          return { foo: "bar" };
        },
      });
      expectTypeOf(await handler({} as H3Event)).toEqualTypeOf<{
        foo: string;
      }>();
    });
  });

  describe("readBody", () => {
    it("untyped", () => {
      eventHandler(async (event) => {
        const body = await readBody(event);
        // TODO: Default to unknown in next major version
        expectTypeOf(body).toBeAny();
      });
    });

    it("typed via generic", () => {
      eventHandler(async (event) => {
        const body = await readBody<string>(event);
        expectTypeOf(body).not.toBeAny();
        expectTypeOf(body).toBeString();
      });
    });

    it("typed via validator", () => {
      eventHandler(async (event) => {
        // eslint-disable-next-line unicorn/consistent-function-scoping
        const validator = (body: unknown) => body as { id: string };
        const body = await readValidatedBody(event, validator);
        expectTypeOf(body).not.toBeAny();
        expectTypeOf(body).toEqualTypeOf<{ id: string }>();
      });
    });

    it("typed via event handler", () => {
      eventHandler<{ body: { id: string } }>(async (event) => {
        const body = await readBody(event);
        expectTypeOf(body).not.toBeAny();
        expectTypeOf(body).toEqualTypeOf<{ id: string }>();
      });
    });
  });

  describe("getQuery", () => {
    it("untyped", () => {
      eventHandler((event) => {
        const query = getQuery(event);
        expectTypeOf(query).not.toBeAny();
        expectTypeOf(query).toEqualTypeOf<QueryObject>();
      });
    });

    it("typed via generic", () => {
      eventHandler((event) => {
        const query = getQuery<{ id: string }>(event);
        expectTypeOf(query).not.toBeAny();
        expectTypeOf(query).toEqualTypeOf<{ id: string }>();
      });
    });

    it("typed via validator", () => {
      eventHandler(async (event) => {
        // eslint-disable-next-line unicorn/consistent-function-scoping
        const validator = (body: unknown) => body as { id: string };
        const body = await getValidatedQuery(event, validator);
        expectTypeOf(body).not.toBeAny();
        expectTypeOf(body).toEqualTypeOf<{ id: string }>();
      });
    });

    it("typed via event handler", () => {
      eventHandler<{ query: { id: string } }>((event) => {
        const query = getQuery(event);
        expectTypeOf(query).not.toBeAny();
        expectTypeOf(query).toEqualTypeOf<{ id: string }>();
      });
    });
  });
});
