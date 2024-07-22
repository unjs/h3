import { describe, it, expect } from "vitest";
import { noContent } from "../src";
import { setupTest } from "./_setup";

async function webResponseToPlain(res: Response) {
  return {
    status: res.status,
    statusText: res.statusText,
    body: await res.text(),
    headers: Object.fromEntries(res.headers),
  };
}

describe("set event.response", () => {
  const ctx = setupTest();

  describe("content response", () => {
    it("sets status 200 as default", async () => {
      ctx.app.use("/test", () => "text");

      const res = await ctx.app.fetch("/test", {
        method: "POST",
      });

      expect(await webResponseToPlain(res)).toMatchObject({
        status: 200,
        statusText: "",
        body: "text",
        headers: {
          "content-type": "text/plain;charset=UTF-8",
        },
      });
    });
    it("override status and statusText", async () => {
      ctx.app.use("/test", (event) => {
        event.response.status = 418;
        event.response.statusText = "status-text";
        return "text";
      });

      const res = await ctx.app.fetch("/test", {
        method: "POST",
        body: "",
      });

      expect(await webResponseToPlain(res)).toMatchObject({
        status: 418,
        statusText: "status-text",
        body: "text",
        headers: {
          "content-type": "text/plain;charset=UTF-8",
        },
      });
    });
  });

  describe("no content response", () => {
    it("sets status 204 as default", async () => {
      ctx.app.use("/test", (event) => {
        return noContent(event);
      });

      const res = await ctx.app.fetch("/test", {
        method: "POST",
      });

      expect(await webResponseToPlain(res)).toMatchObject({
        status: 204,
        statusText: "",
        body: "",
        headers: {},
      });
    });
    it("override status and statusText with setResponseStatus method", async () => {
      ctx.app.use("/test", (event) => {
        event.response.status = 418;
        event.response.statusText = "status-text";
        return "";
      });

      const res = await ctx.app.fetch("/test", {
        method: "POST",
        body: "",
      });

      expect(await webResponseToPlain(res)).toMatchObject({
        status: 418,
        statusText: "status-text",
        body: "",
        headers: {},
      });
    });

    it("does not sets content-type for 304", async () => {
      ctx.app.use("/test", (event) => {
        event.response.status = 304;
        event.response.statusText = "Not Modified";
        return "";
      });

      const res = await ctx.app.fetch("/test");

      expect(await webResponseToPlain(res)).toMatchObject({
        status: 304,
        statusText: "Not Modified",
        body: "",
        headers: {},
      });
    });
  });
});
