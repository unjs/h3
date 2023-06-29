import { describe, it, expectTypeOf } from "vitest";
import {
  eventHandler,
  H3Event,
  readBody,
  getQuery,
} from "../src";

describe("types for event handlers", () => {
  it("return type test", async () => {
    const handler = eventHandler(() => {
      return {
        foo: 'bar'
      }
    })

    expectTypeOf(handler({} as H3Event)).toEqualTypeOf<{ foo: string } | Promise<{ foo: string }>>()
  });

  it("input type test", () => {
    eventHandler<{ body: { id: string } }>(async (event) => {
      const body = await readBody(event)
      expectTypeOf(body).toEqualTypeOf<{ id: string }>()
      expectTypeOf(getQuery(event)).toBeUnknown()

      return null
    })

    eventHandler<{ query: { id: string } }>(async (event) => {
      const query = getQuery(event)
      expectTypeOf(query).toEqualTypeOf<{ id: string }>()

      return null
    })
  });

  it("allows backwards compatible generic for eventHandler definition", () => {
    const handler = eventHandler<string>(async () => {
      return ''
    })
    expectTypeOf(handler({} as H3Event)).toEqualTypeOf<string | Promise<string>>()
  })

  // For backwards compatibility - this should likely become `unknown` in future
  it("input types aren't applied when omitted", () => {
    eventHandler(async (event) => {
      const body = await readBody(event)
      expectTypeOf(body).toBeAny()
      expectTypeOf(getQuery(event)).toBeAny()

      return null
    })
  })
});
