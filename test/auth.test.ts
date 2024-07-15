import { Server } from "node:http";
import getPort from "get-port";
import { Client } from "undici";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createApp,
  toNodeListener,
  App,
  eventHandler,
  withBasicAuth,
} from "../src";

describe("auth", () => {
  let app: App;
  let server: Server;
  let client: Client;

  beforeEach(async () => {
    app = createApp({ debug: true });
    server = new Server(toNodeListener(app));
    const port = await getPort();
    server.listen(port);
    client = new Client(`http://localhost:${port}`);
  });

  afterEach(() => {
    client.close();
    server.close();
  });

  describe("withBasicAuth", () => {
    it("responds 401 for a missing authorization header", async () => {
      app.use(
        "/test",
        withBasicAuth(
          { username: "test", password: "123!" },
          eventHandler(async () => {
            return "Hello, world!";
          }),
        ),
      );
      const result = await client.request({
        path: "/test",
        method: "GET",
      });

      expect(await result.body.text()).toBe("Authentication required");
      expect(result.statusCode).toBe(401);
    });

    it("responds 401 for an incorrect authorization header", async () => {
      app.use(
        "/test",
        withBasicAuth(
          { username: "test", password: "123!" },
          eventHandler(async () => {
            return "Hello, world!";
          }),
        ),
      );
      const result = await client.request({
        path: "/test",
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from("test:wrongpass").toString("base64")}`,
        },
      });

      expect(await result.body.text()).toBe("Authentication required");
      expect(result.statusCode).toBe(401);
    });

    it("responds 200 for a correct authorization header", async () => {
      app.use(
        "/test",
        withBasicAuth(
          "test:123!",
          eventHandler(async () => {
            return "Hello, world!";
          }),
        ),
      );
      const result = await client.request({
        path: "/test",
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from("test:123!").toString("base64")}`,
        },
      });

      expect(await result.body.text()).toBe("Hello, world!");
      expect(result.statusCode).toBe(200);
    });
  });
});
