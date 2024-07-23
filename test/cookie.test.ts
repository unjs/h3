import { describe, it, expect } from "vitest";
import { getCookie, parseCookies, setCookie } from "../src/utils/cookie";
import { setupTest } from "./_setup";

describe("", () => {
  const ctx = setupTest();

  describe("parseCookies", () => {
    it("can parse cookies", async () => {
      ctx.app.use("/", (event) => {
        const cookies = parseCookies(event);
        expect(cookies).toEqual({ Authorization: "1234567" });
        return "200";
      });

      const result = await ctx.fetch("/", {
        headers: {
          Cookie: "Authorization=1234567",
        },
      });

      expect(await result.text()).toBe("200");
    });

    it("can parse empty cookies", async () => {
      ctx.app.use("/", (event) => {
        const cookies = parseCookies(event);
        expect(cookies).toEqual({});
        return "200";
      });

      const result = await ctx.fetch("/");

      expect(await result.text()).toBe("200");
    });
  });

  describe("getCookie", () => {
    it("can parse cookie with name", async () => {
      ctx.app.use("/", (event) => {
        const authorization = getCookie(event, "Authorization");
        expect(authorization).toEqual("1234567");
        return "200";
      });

      const result = await ctx.fetch("/", {
        headers: {
          Cookie: "Authorization=1234567",
        },
      });

      expect(await result.text()).toBe("200");
    });
  });

  describe("setCookie", () => {
    it("can set-cookie with setCookie", async () => {
      ctx.app.use("/", (event) => {
        setCookie(event, "Authorization", "1234567", {});
        return "200";
      });
      const result = await ctx.fetch("/");
      expect(result.headers.getSetCookie()).toEqual([
        "Authorization=1234567; Path=/",
      ]);
      expect(await result.text()).toBe("200");
    });

    it("can set cookies with the same name but different serializeOptions", async () => {
      ctx.app.use("/", (event) => {
        setCookie(event, "Authorization", "1234567", {
          domain: "example1.test",
        });
        setCookie(event, "Authorization", "7654321", {
          domain: "example2.test",
        });
        return "200";
      });
      const result = await ctx.fetch("/");
      expect(result.headers.getSetCookie()).toEqual([
        "Authorization=1234567; Domain=example1.test; Path=/",
        "Authorization=7654321; Domain=example2.test; Path=/",
      ]);
      expect(await result.text()).toBe("200");
    });
  });

  it("can merge unique cookies", async () => {
    ctx.app.use("/", (event) => {
      setCookie(event, "session", "123", { httpOnly: true });
      setCookie(event, "session", "123", {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
      });
      return "200";
    });
    const result = await ctx.fetch("/");
    expect(result.headers.getSetCookie()).toEqual([
      "session=123; Max-Age=2592000; Path=/; HttpOnly",
    ]);
    expect(await result.text()).toBe("200");
  });
});
