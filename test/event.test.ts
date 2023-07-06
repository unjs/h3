import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import {
  createApp,
  App,
  toNodeListener,
  eventHandler,
  getMethod,
  getHeaders,
  getHeader,
} from "../src";

describe("", () => {
  let app: App;
  let request: SuperTest<Test>;

  beforeEach(() => {
    app = createApp({ debug: false });
    request = supertest(toNodeListener(app));
  });

  describe("Event", () => {
    it("can read the method", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          expect(event.method).toBe(getMethod(event));
          expect(event.method).toBe("POST");
          return "200";
        })
      );
      const result = await request.post("/hello");
      expect(result.text).toBe("200");
    });

    it("can read the headers", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          expect(event.headers.get("hi")).toBe("there");
          expect(event.headers.get("hello")).toBe(getHeader(event, "hello"));
          expect(Object.fromEntries(event.headers.entries())).toMatchObject(
            getHeaders(event)
          );
          return "200";
        })
      );
      const result = await request
        .post("/hello")
        .set("hi", "there")
        .set("hello", "world");
      expect(result.text).toBe("200");
    });
  });
});
