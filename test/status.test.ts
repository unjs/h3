import { describe, it, expect, beforeEach } from "vitest";
import {
  createApp,
  App,
  toPlainHandler,
  PlainHandler,
  eventHandler,
  setResponseStatus,
  send,
} from "../src";

describe("setResponseStatus", () => {
  let app: App;
  let handler: PlainHandler;

  beforeEach(() => {
    app = createApp({ debug: true });
    handler = toPlainHandler(app);
  });

  describe("content response", () => {
    it("sets status 200 as default", async () => {
      app.use(
        "/test",
        eventHandler(() => {
          return "text";
        }),
      );

      const res = await handler({
        method: "POST",
        path: "/test",
        headers: [],
      });

      expect(res).toMatchObject({
        status: 200,
        statusText: "",
        body: "text",
        headers: [["content-type", "text/html"]],
      });
    });
    it("override status and statusText with setResponeStatus method", async () => {
      app.use(
        "/test",
        eventHandler((event) => {
          setResponseStatus(event, 418, "status-text");
          return "text";
        }),
      );

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
        headers: [["content-type", "text/html"]],
      });
    });
  });

  describe("no content response", () => {
    it("sets status 204 as default", async () => {
      app.use(
        "/test",
        eventHandler(() => {
          return null;
        }),
      );

      const res = await handler({
        method: "POST",
        path: "/test",
        headers: [],
      });

      expect(res).toMatchObject({
        status: 204,
        statusText: "",
        body: undefined,
        headers: [],
      });
    });
    it("override status and statusText with setResponeStatus method", async () => {
      app.use(
        "/test",
        eventHandler((event) => {
          setResponseStatus(event, 418, "status-text");
          return null;
        }),
      );

      const res = await handler({
        method: "POST",
        path: "/test",
        headers: [],
        body: "",
      });

      expect(res).toMatchObject({
        status: 418,
        statusText: "status-text",
        body: undefined,
        headers: [],
      });
    });

    it("does not sets content-type for 304", async () => {
      app.use(
        "/test",
        eventHandler((event) => {
          setResponseStatus(event, 304, "Not Modified");
          return "";
        }),
      );

      const res = await handler({
        method: "GET",
        path: "/test",
        headers: [],
        body: "",
      });

      console.log(res.headers);

      expect(res).toMatchObject({
        status: 304,
        statusText: "Not Modified",
        body: undefined,
        headers: [],
      });
    });
  });
});
