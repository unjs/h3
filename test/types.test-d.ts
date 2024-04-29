import { describe, it, expectTypeOf } from "vitest";
import type { QueryObject } from "ufo";
import {
  eventHandler,
  H3Event,
  getQuery,
  readBody,
  readValidatedBody,
  getValidatedQuery,
} from "../src";

describe("types", () => {
  describe("eventHandler", () => {
    it("object syntax definitions", async () => {
      const handler = eventHandler({
        onRequest: [
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
      const handler = eventHandler<undefined, undefined, {}, string>(() => {
        return "";
      });
      const response = handler({} as H3Event);
      expectTypeOf(response).toEqualTypeOf<string>();
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
        const validator = (body: unknown) => body as { id: string };
        const body = await readValidatedBody(event, validator);
        expectTypeOf(body).not.toBeAny();
        expectTypeOf(body).toEqualTypeOf<{ id: string }>();
      });

      eventHandler({
        bodyValidator: (body: unknown) => body as { id: string },
        handler: async (event) => {
          const body = await readBody(event);
          expectTypeOf(body).not.toBeAny();
          expectTypeOf(body).toEqualTypeOf<{ id: string }>();
        }
      });
    });

    it("typed via event handler", () => {
      eventHandler<{ id: string }>(async (event) => {
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
        const validator = (query: unknown) => query as { id: string };
        const query = await getValidatedQuery(event, validator);
        expectTypeOf(query).not.toBeAny();
        expectTypeOf(query).toEqualTypeOf<{ id: string }>();
      });

      eventHandler({
        queryValidator: (query: unknown) => query as { id: string },
        handler: (event) => {
          const query = getQuery(event);
          expectTypeOf(query).not.toBeAny();
          expectTypeOf(query).toEqualTypeOf<{ id: string }>();
        }
      });
    });

    it("typed via event handler", () => {
      eventHandler<undefined, { id: string }>((event) => {
        const query = getQuery(event);
        expectTypeOf(query).not.toBeAny();
        expectTypeOf(query).toEqualTypeOf<{ id: string }>();
      });
    });
  });
});
