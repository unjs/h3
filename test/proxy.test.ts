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
  setHeader,
  readRawBody,
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

  describe("cookieDomainRewrite", () => {
    beforeEach(() => {
      app.use(
        "/debug",
        eventHandler((event) => {
          setHeader(
            event,
            "set-cookie",
            "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT"
          );
          return {};
        })
      );
    });

    it("can rewrite cookie domain by string", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", {
            fetch,
            cookieDomainRewrite: "new.domain",
          });
        })
      );

      const result = await fetch(url + "/");

      expect(result.headers.get("set-cookie")).toEqual(
        "foo=219ffwef9w0f; Domain=new.domain; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT"
      );
    });

    it("can rewrite cookie domain by mapper object", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", {
            fetch,
            cookieDomainRewrite: {
              "somecompany.co.uk": "new.domain",
            },
          });
        })
      );

      const result = await fetch(url + "/");

      expect(result.headers.get("set-cookie")).toEqual(
        "foo=219ffwef9w0f; Domain=new.domain; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT"
      );
    });

    it("can rewrite domains of multiple cookies", async () => {
      app.use(
        "/multiple/debug",
        eventHandler((event) => {
          setHeader(event, "set-cookie", [
            "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
            "bar=38afes7a8; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
          ]);
          return {};
        })
      );

      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/multiple/debug", {
            fetch,
            cookieDomainRewrite: {
              "somecompany.co.uk": "new.domain",
            },
          });
        })
      );

      const result = await fetch(url + "/");

      expect(result.headers.get("set-cookie")).toEqual(
        "foo=219ffwef9w0f; Domain=new.domain; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT, bar=38afes7a8; Domain=new.domain; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT"
      );
    });

    it("can remove cookie domain", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", {
            fetch,
            cookieDomainRewrite: {
              "somecompany.co.uk": "",
            },
          });
        })
      );

      const result = await fetch(url + "/");

      expect(result.headers.get("set-cookie")).toEqual(
        "foo=219ffwef9w0f; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT"
      );
    });
  });

  describe("cookiePathRewrite", () => {
    beforeEach(() => {
      app.use(
        "/debug",
        eventHandler((event) => {
          setHeader(
            event,
            "set-cookie",
            "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT"
          );
          return {};
        })
      );
    });

    it("can rewrite cookie path by string", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", {
            fetch,
            cookiePathRewrite: "/api",
          });
        })
      );

      const result = await fetch(url + "/");

      expect(result.headers.get("set-cookie")).toEqual(
        "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/api; Expires=Wed, 30 Aug 2022 00:00:00 GMT"
      );
    });

    it("can rewrite cookie path by mapper object", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", {
            fetch,
            cookiePathRewrite: {
              "/": "/api",
            },
          });
        })
      );

      const result = await fetch(url + "/");

      expect(result.headers.get("set-cookie")).toEqual(
        "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/api; Expires=Wed, 30 Aug 2022 00:00:00 GMT"
      );
    });

    it("can rewrite paths of multiple cookies", async () => {
      app.use(
        "/multiple/debug",
        eventHandler((event) => {
          setHeader(event, "set-cookie", [
            "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
            "bar=38afes7a8; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
          ]);
          return {};
        })
      );

      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/multiple/debug", {
            fetch,
            cookiePathRewrite: {
              "/": "/api",
            },
          });
        })
      );

      const result = await fetch(url + "/");

      expect(result.headers.get("set-cookie")).toEqual(
        "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/api; Expires=Wed, 30 Aug 2022 00:00:00 GMT, bar=38afes7a8; Domain=somecompany.co.uk; Path=/api; Expires=Wed, 30 Aug 2022 00:00:00 GMT"
      );
    });

    it("can remove cookie path", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", {
            fetch,
            cookiePathRewrite: {
              "/": "",
            },
          });
        })
      );

      const result = await fetch(url + "/");

      expect(result.headers.get("set-cookie")).toEqual(
        "foo=219ffwef9w0f; Domain=somecompany.co.uk; Expires=Wed, 30 Aug 2022 00:00:00 GMT"
      );
    });
  });
});
