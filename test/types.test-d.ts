import { describe, it, expectTypeOf } from "vitest";
import type { QueryObject } from "ufo";
import { eventHandler, H3Event, getQuery, readBody } from "../src";

type MaybePromise<T> = T | Promise<T>;

describe("types", () => {
  describe("eventHandler", () => {
    it("return type (inferred)", () => {
      const handler = eventHandler(() => {
        return {
          foo: "bar",
        };
      });
      expectTypeOf(handler({} as H3Event)).toEqualTypeOf<
        MaybePromise<{ foo: string }>
      >();
    });

    it("return type (simple generic)", () => {
      const handler = eventHandler<string>(() => {
        return "";
      });
      expectTypeOf(handler({} as H3Event)).toEqualTypeOf<
        MaybePromise<string>
      >();
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

    it("typed via event handler", () => {
      eventHandler<{ query: { id: string } }>((event) => {
        const query = getQuery(event);
        expectTypeOf(query).not.toBeAny();
        expectTypeOf(query).toEqualTypeOf<{ id: string }>();
      });
    });
  });
});
