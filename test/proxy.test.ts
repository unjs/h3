import { Server } from "node:http";
import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fetch } from "node-fetch-native";
import {
  createApp,
  toNodeListener,
  App,
  eventHandler,
  getHeaders,
  getMethod,
  readRawBody,
  setCookie,
} from "../src";
import { sendProxy, proxyRequest } from "../src/utils/proxy";

describe("", () => {
  let app: App;
  let request: SuperTest<Test>;

  let server: Server;
  let url: string;

  beforeEach(async () => {
    app = createApp({ debug: false });
    request = supertest(toNodeListener(app));
    server = new Server(toNodeListener(app));
    await new Promise((resolve) => {
      server.listen(0, () => resolve(undefined));
    });
    url = "http://localhost:" + (server.address() as any).port;
  });

  afterEach(async () => {
    await new Promise((resolve) => {
      server.close(() => resolve(undefined));
    });
  });

  describe("sendProxy", () => {
    it("can sendProxy", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return sendProxy(event, "https://example.com", { fetch });
        })
      );

      const result = await request.get("/");

      expect(result.text).toContain(
        'a href="https://www.iana.org/domains/example">More information...</a>'
      );
    });
  });

  describe("proxyRequest", () => {
    it("can proxy request", async () => {
      app.use(
        "/debug",
        eventHandler(async (event) => {
          const headers = getHeaders(event);
          delete headers.host;
          let body;
          try {
            body = await readRawBody(event);
          } catch {}
          return {
            method: getMethod(event),
            headers,
            body,
          };
        })
      );

      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", { fetch });
        })
      );

      const result = await fetch(url + "/", {
        method: "POST",
        body: "hello",
      }).then((r) => r.text());

      expect(result).toMatchInlineSnapshot(
        '"{\\"method\\":\\"POST\\",\\"headers\\":{\\"accept\\":\\"*/*\\",\\"accept-encoding\\":\\"gzip, deflate, br\\",\\"connection\\":\\"close\\",\\"content-length\\":\\"5\\",\\"content-type\\":\\"text/plain;charset=UTF-8\\",\\"user-agent\\":\\"node-fetch\\"},\\"body\\":\\"hello\\"}"'
      );
    });
  });

  describe("multipleCookies", () => {
    it("can split multiple cookies", async () => {
      app.use(
        "/setcookies",
        eventHandler((event) => {
          setCookie(event, "user", "alice", {
            expires: new Date("Thu, 01 Jun 2023 10:00:00 GMT"),
            httpOnly: true,
          });
          setCookie(event, "role", "guest");
          return {};
        })
      );

      app.use(
        "/",
        eventHandler((event) => {
          return sendProxy(event, url + "/setcookies", { fetch });
        })
      );

      const result = await request.get("/");
      const cookies = result.header["set-cookie"];
      expect(cookies).toEqual([
        "user=alice; Path=/; Expires=Thu, 01 Jun 2023 10:00:00 GMT; HttpOnly",
        "role=guest; Path=/",
      ]);
    });
  });
});
