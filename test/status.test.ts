import { describe, it, expect, beforeEach } from "vitest";
import { toPlainHandler } from "../src/adapters/web";
import { setResponseStatus } from "../src";
import { setupTest } from "./_setup";

describe("setResponseStatus", () => {
  const ctx = setupTest();
  let handler: ReturnType<typeof toPlainHandler>;

  beforeEach(() => {
    handler = toPlainHandler(ctx.app);
  });

  describe("content response", () => {
    it("sets status 200 as default", async () => {
      ctx.app.use("/test", () => "text");

      const res = await handler({
        method: "POST",
        path: "/test",
        headers: [],
      });

      expect(res).toMatchObject({
        status: 200,
        statusText: "",
        body: "text",
        headers: {
          "content-type": "text/html",
        },
      });
    });
    it("override status and statusText with setResponseStatus method", async () => {
      ctx.app.use("/test", (event) => {
        setResponseStatus(event, 418, "status-text");
        return "text";
      });

      const res = await handler({
        method: "POST",
        path: "/test",
        headers: [],
        body: "",
      });

      expect(res).toMatchObject({
        status: 418,
        statusText: "status-text",
        body: "text",
        headers: {
          "content-type": "text/html",
        },
      });
    });
  });

  describe("no content response", () => {
    it("sets status 204 as default", async () => {
      ctx.app.use("/test", () => {
        return null;
      });

      const res = await handler({
        method: "POST",
        path: "/test",
        headers: [],
      });

      expect(res).toMatchObject({
        status: 204,
        statusText: "",
        body: null,
        headers: {},
      });
    });
    it("override status and statusText with setResponseStatus method", async () => {
      ctx.app.use("/test", (event) => {
        setResponseStatus(event, 418, "status-text");
        return "";
      });

      const res = await handler({
        method: "POST",
        path: "/test",
        headers: [],
        body: "",
      });

      expect(res).toMatchObject({
        status: 418,
        statusText: "status-text",
        body: "",
        headers: {},
      });
    });

    it("does not sets content-type for 304", async () => {
      ctx.app.use("/test", (event) => {
        setResponseStatus(event, 304, "Not Modified");
        return "";
      });

      const res = await handler({
        method: "GET",
        path: "/test",
        headers: [],
      });

      // console.log(res.headers);

      expect(res).toMatchObject({
        status: 304,
        statusText: "Not Modified",
        body: null,
        headers: {},
      });
    });
  });
});
