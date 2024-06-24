import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import {
  createApp,
  toNodeListener,
  App,
  eventHandler,
  readValidatedBody,
  getValidatedQuery,
  ValidateFunction,
  createError,
  validateEvent,
  defineEventValidator,
} from "../src";

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
  let app: App;
  let request: SuperTest<Test>;

  beforeEach(() => {
    app = createApp({ debug: true });
    request = supertest(toNodeListener(app));
  });

  describe("readValidatedBody", () => {
    beforeEach(() => {
      app.use(
        "/custom",
        eventHandler(async (event) => {
          const data = await readValidatedBody(event, customValidate);
          return data;
        }),
      );

      app.use(
        "/zod",
        eventHandler(async (event) => {
          const data = await readValidatedBody(event, zodValidate);
          return data;
        }),
      );
    });

    describe("custom validator", () => {
      it("Valid JSON", async () => {
        const res = await request.post("/custom").send({ field: "value" });
        expect(res.body).toEqual({ field: "value", default: "default" });
        expect(res.status).toEqual(200);
      });

      it("Valid x-www-form-urlencoded", async () => {
        const res = await request
          .post("/custom")
          .set("Content-Type", "application/x-www-form-urlencoded")
          .send("field=value");
        expect(res.body).toEqual({ field: "value", default: "default" });
        expect(res.status).toEqual(200);
      });

      it("Invalid JSON", async () => {
        const res = await request.post("/custom").send({ invalid: true });
        expect(res.text).include("Invalid key");
        expect(res.status).toEqual(400);
      });
    });

    describe("zod validator", () => {
      it("Valid", async () => {
        const res = await request.post("/zod").send({ field: "value" });
        expect(res.body).toEqual({ field: "value", default: "default" });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await request.post("/zod").send({ invalid: true });
        expect(res.status).toEqual(400);
        expect(res.body.data?.issues?.[0]?.code).toEqual("invalid_type");
      });
    });
  });

  describe("getQuery", () => {
    beforeEach(() => {
      app.use(
        "/custom",
        eventHandler(async (event) => {
          const data = await getValidatedQuery(event, customValidate);
          return data;
        }),
      );

      app.use(
        "/zod",
        eventHandler(async (event) => {
          const data = await getValidatedQuery(event, zodValidate);
          return data;
        }),
      );
    });

    describe("custom validator", () => {
      it("Valid", async () => {
        const res = await request.get("/custom?field=value");
        expect(res.body).toEqual({ field: "value", default: "default" });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await request.get("/custom?invalid=true");
        expect(res.text).include("Invalid key");
        expect(res.status).toEqual(400);
      });
    });

    describe("zod validator", () => {
      it("Valid", async () => {
        const res = await request.get("/zod?field=value");
        expect(res.body).toEqual({ field: "value", default: "default" });
        expect(res.status).toEqual(200);
      });

      it("Invalid", async () => {
        const res = await request.get("/zod?invalid=true");
        expect(res.status).toEqual(400);
      });
    });
  });

  describe("event validation", () => {
    const eventValidator = defineEventValidator((event) => {
      if (event.path === "/invalid") {
        throw createError({ message: "Invalid path", status: 400 });
      }
      return undefined as any;
    });

    it("object syntax validate", async () => {
      app.use(
        eventHandler({
          validate: eventValidator,
          handler: () => {
            return "ok";
          },
        }),
      );
      const res = await request.get("/invalid");
      expect(res.text).include("Invalid path");
      expect(res.status).toEqual(400);
      expect((await request.get("/")).text).toBe("ok");
    });

    it("validateEvent", async () => {
      app.use(
        eventHandler(async (_event) => {
          await validateEvent(_event, eventValidator);
          return "ok";
        }),
      );
      const res = await request.get("/invalid");
      expect(res.text).include("Invalid path");
      expect(res.status).toEqual(400);
      expect((await request.get("/")).text).toBe("ok");
    });
  });
});
