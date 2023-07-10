import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import {
  createApp,
  App,
  toNodeListener,
  eventHandler,
  getMethod,
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

    it.runIf(typeof Headers !== undefined)("can read the headers", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return {
            headers: [...event.headers.entries()],
          };
        })
      );
      const result = await request.post("/hello").set("X-A", "works");
      const { headers } = JSON.parse(result.text);
      expect(headers.find(([key]) => key === "x-a")[1]).toBe("works");
    });
  });
});
