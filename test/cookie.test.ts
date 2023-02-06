import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import { createApp, toNodeListener, App, eventHandler } from "../src";
import { getCookie, parseCookies, setCookie } from "../src/utils/cookie";

describe("", () => {
  let app: App;
  let request: SuperTest<Test>;

  beforeEach(() => {
    app = createApp({ debug: false });
    request = supertest(toNodeListener(app));
  });

  describe("parseCookies", () => {
    it("can parse cookies", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          const cookies = parseCookies(event);
          expect(cookies).toEqual({ Authorization: "1234567" });
          return "200";
        })
      );

      const result = await request
        .get("/")
        .set("Cookie", ["Authorization=1234567"]);

      expect(result.text).toBe("200");
    });

    it("can parse empty cookies", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          const cookies = parseCookies(event);
          expect(cookies).toEqual({});
          return "200";
        })
      );

      const result = await request.get("/");

      expect(result.text).toBe("200");
    });
  });

  describe("useCookie", () => {
    it("can parse cookie with name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          const authorization = getCookie(event, "Authorization");
          expect(authorization).toEqual("1234567");
          return "200";
        })
      );

      const result = await request
        .get("/")
        .set("Cookie", ["Authorization=1234567"]);

      expect(result.text).toBe("200");
    });
  });

  describe("setCookie", () => {
    it("can set-cookie with setCookie", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setCookie(event, "Authorization", "1234567", {});
          return "200";
        })
      );
      const result = await request.get("/");
      expect(result.headers["set-cookie"]).toEqual([
        "Authorization=1234567; Path=/",
      ]);
      expect(result.text).toBe("200");
    });
  });
});
