import { describe, it, expect, vi } from "vitest";
import { setupTest } from "./_utils";
import { defineEventHandler } from "../src";

(global.console.error as any) = vi.fn();

describe("lazy loading", () => {
  const ctx = setupTest();

  const handlers = [
    ["sync", defineEventHandler(() => "lazy")],
    ["async", defineEventHandler(() => Promise.resolve("lazy"))],
  ] as const;
  const kinds = [
    ["default export", (handler: any) => ({ default: handler })],
    ["non-default export", (handler: any) => handler],
  ] as const;

  for (const [type, handler] of handlers) {
    for (const [kind, resolution] of kinds) {
      it(`can load ${type} handlers lazily from a ${kind}`, async () => {
        ctx.app.use("/big", () => Promise.resolve(resolution(handler)), {
          lazy: true,
        });
        const result = await ctx.request.get("/big");

        expect(result.text).toBe("lazy");
      });

      it(`can handle ${type} functions that don't return promises from a ${kind}`, async () => {
        ctx.app.use("/big", () => resolution(handler), { lazy: true });
        const result = await ctx.request.get("/big");

        expect(result.text).toBe("lazy");
      });
    }
  }
});
