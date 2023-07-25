import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, expectTypeOf, beforeEach } from "vitest";
import { z } from "zod";
import {
  createApp,
  toNodeListener,
  App,
  eventHandler,
  readBodySafe,
  createError,
  getQuerySafe,
} from "../src";

describe("", () => {
  let app: App;
  let request: SuperTest<Test>;

  beforeEach(() => {
    app = createApp({ debug: true });
    request = supertest(toNodeListener(app));
  });

  describe("query validation", () => {
    it("can parse and return safe query params", async () => {
      app.use(
        "/",
        eventHandler(async (event) => {
          const schema = z.object({
            bool: z.string(),
            name: z.string(),
            number: z.string(),
          });
          const query = await getQuerySafe(event, schema);
          expectTypeOf(query).toMatchTypeOf<{
            bool: string;
            name: string;
            number: string;
          }>();
          return query;
        })
      );
      const result = await request.get(
        "/api/test?bool=true&name=string&number=1"
      );
      expect(result.statusCode).toBe(200);
      expect(result.body).toMatchObject({
        bool: "true",
        name: "string",
        number: "1",
      });
    });
  });

  const below18 = Number.parseInt(process.version.slice(1).split(".")[0]) < 18;
  describe("body validation", () => {
    it.skipIf(below18)(
      "can parse and return safe x-www-form-urlencoded data",
      async () => {
        app.use(
          "/",
          eventHandler(async (event) => {
            const schema = z.object({
              firstName: z.string(),
              lastName: z.string(),
            });
            const data = await readBodySafe(event, schema);
            expectTypeOf(data).toMatchTypeOf<{
              firstName: string;
              lastName: string;
            }>();
            return { ...data };
          })
        );

        const result = await request
          .post("/api/test")
          .set("content-type", "application/x-www-form-urlencoded")
          .send("firstName=John&lastName=Doe");

        expect(result.status).toBe(200);
        expect(result.body).toMatchObject({
          firstName: "John",
          lastName: "Doe",
        });
      }
    );

    it("can parse and return safe json data", async () => {
      app.use(
        "/",
        eventHandler(async (event) => {
          const schema = z.object({
            firstName: z.string(),
            lastName: z.string(),
          });
          const data = await readBodySafe(event, schema);
          expectTypeOf(data).toMatchTypeOf<{
            firstName: string;
            lastName: string;
          }>();
          return { ...data };
        })
      );

      const result = await request
        .post("/api/test")
        .set("content-type", "application/json")
        .send({ firstName: "John", lastName: "Doe", age: 30 });

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({
        firstName: "John",
        lastName: "Doe",
      });
    });

    it.skipIf(below18)("can throw an error on schema mismatch", async () => {
      app.use(
        "/",
        eventHandler(async (event) => {
          const schema = z.object({
            firstName: z.string(),
            lastName: z.number(),
          });
          const data = await readBodySafe(event, schema);
          return { ...data };
        })
      );

      const result = await request
        .post("/api/test")
        .set("content-type", "application/x-www-form-urlencoded")
        .send("firstName=John&lastName=Doe");

      expect(result.status).toBe(500);
      expect(result.body).toMatchObject({ statusCode: 500 });
    });

    it.skipIf(below18)(
      "can throw a custom error when assertion fails",
      async () => {
        app.use(
          "/",
          eventHandler(async (event) => {
            const schema = z.object({
              firstName: z.string(),
              lastName: z.number(),
            });
            const data = await readBodySafe(event, schema, () => {
              throw createError({
                statusMessage: "Invalid data",
                statusCode: 400,
              });
            });
            return { ...data };
          })
        );

        const result = await request
          .post("/api/test")
          .set("content-type", "application/x-www-form-urlencoded")
          .send("firstName=John&lastName=Doe");

        expect(result.status).toBe(400);
        expect(result.body).toMatchObject({
          statusMessage: "Invalid data",
          statusCode: 400,
        });
      }
    );

    it.skipIf(below18)("can throw with a custom validator schema", async () => {
      app.use(
        "/",
        eventHandler(async (event) => {
          const data = await readBodySafe(event, (body) => {
            if (
              body &&
              typeof body === "object" &&
              "firstName" in body &&
              "lastName" in body &&
              "age" in body
            ) {
              return body;
            }
            throw new TypeError("Custom Error");
          });
          return data;
        })
      );

      const result = await request
        .post("/api/test")
        .set("content-type", "application/x-www-form-urlencoded")
        .send("firstName=John&lastName=Doe");

      expect(result.status).toBe(500);
      expect(result.body).toMatchObject({
        statusCode: 500,
      });
    });
  });
});
