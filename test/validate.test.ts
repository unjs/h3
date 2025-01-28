import type { ValidateFunction } from "../src/types";
import { beforeEach } from "vitest";
import * as v from "valibot";
import * as z from "zod";
import {
  readValidatedBody,
  getValidatedQuery,
  getValidatedRouterParams,
  isError,
} from "../src";
import { describeMatrix } from "./_setup";

describeMatrix("validate", (t, { it, describe, expect }) => {
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

  // Valibot schema (example)
  const valibotSchema = v.object({
    default: v.optional(v.string(), "default"),
    field: v.optional(v.string()),
    invalid: v.optional(v.never()),
  });

  // Zod schema (example)
  const zodSchema = z.object({
    default: z.string().default("default"),
    field: z.string().optional(),
    invalid: z.never().optional() /* WTF! */,
  });

  describe("readValidatedBody", () => {
    beforeEach(() => {
      t.app.post("/custom", async (event) => {
        const data = await readValidatedBody(event, customValidate);
        return data;
      });

      t.app.post("/valibot", async (event) => {
        const data = await readValidatedBody(event, valibotSchema);
        return data;
      });

      t.app.post("/valibot-caught", async (event) => {
        try {
          await readValidatedBody(event, valibotSchema);
        } catch (error_) {
          if (
            isError(error_) &&
            error_.statusMessage === "Validation Error" &&
            (error_.cause as any)[0]?.kind === "schema"
          ) {
            return true;
          }
        }
      });

      t.app.post("/zod", async (event) => {
        const data = await readValidatedBody(event, zodSchema);
        return data;
      });

      t.app.post("/zod-caught", async (event) => {
        try {
          await readValidatedBody(event, zodSchema);
        } catch (error_) {
          if (
            isError(error_) &&
            error_.statusMessage === "Validation Error" &&
            (error_.cause as any)[0]?.code === "invalid_type"
          ) {
            return true;
          }
        }
      });
    });

    describe("custom validator", () => {
      it("Valid JSON", async () => {
        const res = await t.fetch("/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: "value" }),
        });
        expect(await res.json()).toEqual({
          field: "value",
          default: "default",
        });
        expect(res.status).toEqual(200);
      });

      it("Validate x-www-form-urlencoded", async () => {
        const res = await t.fetch("/custom", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "field=value",
        });
        expect(await res.json()).toEqual({
          field: "value",
          default: "default",
        });
        expect(res.status).toEqual(200);
      });

      it("Invalid JSON", async () => {
        const res = await t.fetch("/custom", {
          method: "POST",
          body: JSON.stringify({ invalid: true }),
        });
        expect(await res.text()).include("Invalid key");
        expect(res.status).toEqual(400);
      });
    });

    describe("valibot validator", () => {
      it("Valid", async () => {
        const res = await t.fetch("/valibot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: "value" }),
        });
        expect(await res.json()).toEqual({
          field: "value",
          default: "default",
        });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await t.fetch("/valibot", {
          method: "POST",
          body: JSON.stringify({ invalid: true }),
        });
        expect(res.status).toEqual(400);
        expect((await res.json()).data[0].message).toEqual(
          "Invalid type: Expected never but received true",
        );
      });

      it("Caught", async () => {
        const res = await t.fetch("/valibot-caught", {
          method: "POST",
          body: JSON.stringify({ invalid: true }),
        });
        expect(await res.json()).toEqual(true);
      });
    });

    describe("zod validator", () => {
      it("Valid", async () => {
        const res = await t.fetch("/zod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: "value" }),
        });
        expect(await res.json()).toEqual({
          field: "value",
          default: "default",
        });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await t.fetch("/zod", {
          method: "POST",
          body: JSON.stringify({ invalid: true }),
        });
        expect(res.status).toEqual(400);
        expect((await res.json()).data[0]?.code).toEqual("invalid_type");
      });

      it("Caught", async () => {
        const res = await t.fetch("/zod-caught", {
          method: "POST",
          body: JSON.stringify({ invalid: true }),
        });
        expect(await res.json()).toEqual(true);
      });
    });
  });

  describe("getQuery", () => {
    beforeEach(() => {
      t.app.get("/custom", async (event) => {
        const data = await getValidatedQuery(event, customValidate);
        return data;
      });

      t.app.get("/valibot", async (event) => {
        const data = await getValidatedQuery(event, valibotSchema);
        return data;
      });

      t.app.get("/zod", async (event) => {
        const data = await getValidatedQuery(event, zodSchema);
        return data;
      });
    });

    describe("custom validator", () => {
      it("Valid", async () => {
        const res = await t.fetch("/custom?field=value");
        expect(await res.json()).toEqual({
          field: "value",
          default: "default",
        });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await t.fetch("/custom?invalid=true");
        expect(await res.text()).include("Invalid key");
        expect(res.status).toEqual(400);
      });
    });

    describe("valibot validator", () => {
      it("Valid", async () => {
        const res = await t.fetch("/valibot?field=value");
        expect(await res.json()).toEqual({
          field: "value",
          default: "default",
        });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await t.fetch("/valibot?invalid=true");
        expect(res.status).toEqual(400);
      });
    });

    describe("zod validator", () => {
      it("Valid", async () => {
        const res = await t.fetch("/zod?field=value");
        expect(await res.json()).toEqual({
          field: "value",
          default: "default",
        });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await t.fetch("/zod?invalid=true");
        expect(res.status).toEqual(400);
      });
    });
  });

  describe("getRouterParams", () => {
    beforeEach(() => {
      t.app.get("/valibot/:name", async (event) => {
        const data = await getValidatedRouterParams(
          event,
          v.object({
            name: v.pipe(v.string(), v.picklist(["apple", "banana"])),
          }),
        );
        return data;
      });

      t.app.get("/zod/:name", async (event) => {
        const data = await getValidatedRouterParams(
          event,
          z.object({
            name: z.enum(["apple", "banana"]),
          }),
        );
        return data;
      });
    });

    describe("valibot validator", () => {
      it("Valid", async () => {
        const res = await t.fetch("/valibot/apple");
        expect(await res.json()).toEqual({
          name: "apple",
        });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await t.fetch("/valibot/orange");
        expect(res.status).toEqual(400);
      });
    });

    describe("zod validator", () => {
      it("Valid", async () => {
        const res = await t.fetch("/zod/apple");
        expect(await res.json()).toEqual({
          name: "apple",
        });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await t.fetch("/zod/orange");
        expect(res.status).toEqual(400);
      });
    });
  });
});
