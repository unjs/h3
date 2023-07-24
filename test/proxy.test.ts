import { Server } from "node:http";
import { readFile } from "node:fs/promises";
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
    server = new Server(
      {
        keepAlive: false,
        keepAliveTimeout: 1,
      },
      toNodeListener(app)
    );
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
        headers: {
          "content-type": "text/custom",
          "x-custom": "hello",
        },
      }).then((r) => r.json());

      const { headers, ...data } = result;
      expect(headers["content-type"]).toEqual("text/custom");
      expect(headers["x-custom"]).toEqual("hello");
      expect(data).toMatchInlineSnapshot(`
        {
          "body": "hello",
          "method": "POST",
        }
      `);
    });

    it("can proxy binary request", async () => {
      app.use(
        "/debug",
        eventHandler(async (event) => {
          const body = await readRawBody(event, false);
          return {
            bytes: body!.length,
          };
        })
      );

      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", { fetch });
        })
      );

      const dummyFile = await readFile(
        new URL("assets/dummy.pdf", import.meta.url)
      );

      const res = await fetch(url + "/", {
        method: "POST",
        body: dummyFile,
        headers: {
          "content-type": "text/custom",
          "x-custom": "hello",
        },
      });
      const { bytes } = await res.json();

      // expect(res.headers.get("content-type")).toEqual("text/custom");
      // expect(res.headers.get("x-custom")).toEqual("hello");
      expect(bytes).toEqual(dummyFile.length);
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

  describe("onResponse", () => {
    beforeEach(() => {
      app.use(
        "/debug",
        eventHandler(() => {
          return {
            foo: "bar",
          };
        })
      );
    });

    it("allows modifying response event", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", {
            fetch,
            onResponse(_event) {
              setHeader(_event, "x-custom", "hello");
            },
          });
        })
      );

      const result = await request.get("/");

      expect(result.header["x-custom"]).toEqual("hello");
    });

    it("allows modifying response event async", async () => {
      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", {
            fetch,
            onResponse(_event) {
              return new Promise((resolve) => {
                resolve(setHeader(_event, "x-custom", "hello"));
              });
            },
          });
        })
      );

      const result = await request.get("/");

      expect(result.header["x-custom"]).toEqual("hello");
    });

    it("allows to get the actual response", async () => {
      let headers;

      app.use(
        "/",
        eventHandler((event) => {
          return proxyRequest(event, url + "/debug", {
            fetch,
            onResponse(_event, response) {
              headers = Object.fromEntries(response.headers.entries());
            },
          });
        })
      );

      await request.get("/");

      expect(headers["content-type"]).toEqual("application/json");
    });
  });
});
