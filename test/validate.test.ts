import type { ValidateFunction } from "../src/types";
import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { eventHandler, readValidatedJSONBody, getValidatedQuery } from "../src";
import { setupTest } from "./_utils";

// Custom validator
const customValidate: ValidateFunction<{
  invalidKey: never;
  default: string;
  field?: string;
}> = (data: any) => {
  if (data.invalid) {
    throw new Error("Invalid key");
  }
  data.default = "default";
  return data;
};

// Zod validator (example)
const zodValidate = z.object({
  default: z.string().default("default"),
  field: z.string().optional(),
  invalid: z.never().optional() /* WTF! */,
}).parse;

describe("Validate", () => {
  const ctx = setupTest();

  describe("readValidatedJSONBody", () => {
    beforeEach(() => {
      ctx.app.use(
        "/custom",
        eventHandler(async (event) => {
          const data = await readValidatedJSONBody(event, customValidate);
          return data;
        }),
      );

      ctx.app.use(
        "/zod",
        eventHandler(async (event) => {
          const data = await readValidatedJSONBody(event, zodValidate);
          return data;
        }),
      );
    });

    describe("custom validator", () => {
      it("Valid JSON", async () => {
        const res = await ctx.request.post("/custom").send({ field: "value" });
        expect(res.body).toEqual({ field: "value", default: "default" });
        expect(res.status).toEqual(200);
      });

      it("Validate x-www-form-urlencoded", async () => {
        const res = await ctx.request
          .post("/custom")
          .set("Content-Type", "application/x-www-form-urlencoded")
          .send("field=value");
        expect(res.body).toEqual({ field: "value", default: "default" });
        expect(res.status).toEqual(200);
      });

      it("Invalid JSON", async () => {
        const res = await ctx.request.post("/custom").send({ invalid: true });
        expect(res.text).include("Invalid key");
        expect(res.status).toEqual(400);
      });
    });

    describe("zod validator", () => {
      it("Valid", async () => {
        const res = await ctx.request.post("/zod").send({ field: "value" });
        expect(res.body).toEqual({ field: "value", default: "default" });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await ctx.request.post("/zod").send({ invalid: true });
        expect(res.status).toEqual(400);
        expect(res.body.data?.issues?.[0]?.code).toEqual("invalid_type");
      });
    });
  });

  describe("getQuery", () => {
    beforeEach(() => {
      ctx.app.use(
        "/custom",
        eventHandler(async (event) => {
          const data = await getValidatedQuery(event, customValidate);
          return data;
        }),
      );

      ctx.app.use(
        "/zod",
        eventHandler(async (event) => {
          const data = await getValidatedQuery(event, zodValidate);
          return data;
        }),
      );
    });

    describe("custom validator", () => {
      it("Valid", async () => {
        const res = await ctx.request.get("/custom?field=value");
        expect(res.body).toEqual({ field: "value", default: "default" });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await ctx.request.get("/custom?invalid=true");
        expect(res.text).include("Invalid key");
        expect(res.status).toEqual(400);
      });
    });

    describe("zod validator", () => {
      it("Valid", async () => {
        const res = await ctx.request.get("/zod?field=value");
        expect(res.body).toEqual({ field: "value", default: "default" });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await ctx.request.get("/zod?invalid=true");
        expect(res.status).toEqual(400);
      });
    });
  });
});
