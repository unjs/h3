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
        }),
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
        }),
      );

      const result = await request.get("/");

      expect(result.text).toBe("200");
    });
  });

  describe("getCookie", () => {
    it("can parse cookie with name", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          const authorization = getCookie(event, "Authorization");
          expect(authorization).toEqual("1234567");
          return "200";
        }),
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
        }),
      );
      const result = await request.get("/");
      expect(result.headers["set-cookie"]).toEqual([
        "Authorization=1234567; Path=/",
      ]);
      expect(result.text).toBe("200");
    });

    it("can set cookies with the same name but different serializeOptions", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setCookie(event, "Authorization", "1234567", {
            domain: "example1.test",
          });
          setCookie(event, "Authorization", "7654321", {
            domain: "example2.test",
          });
          return "200";
        }),
      );
      const result = await request.get("/");
      expect(result.headers["set-cookie"]).toEqual([
        "Authorization=1234567; Domain=example1.test; Path=/",
        "Authorization=7654321; Domain=example2.test; Path=/",
      ]);
      expect(result.text).toBe("200");
    });

    it("can merge unique cookies", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          setCookie(event, "session", "123", { httpOnly: true });
          setCookie(event, "session", "123", {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 30,
          });
          return "200";
        }),
      );
      const result = await request.get("/");
      expect(result.headers["set-cookie"]).toEqual([
        "session=123; Max-Age=2592000; Path=/; HttpOnly",
      ]);
      expect(result.text).toBe("200");
    });
  });
});
