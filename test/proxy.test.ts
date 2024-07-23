import { readFile } from "node:fs/promises";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setCookie } from "../src";
import { proxy, proxyRequest } from "../src/utils/proxy";
import { setupTest } from "./_setup";

const spy = vi.spyOn(console, "error");

describe("proxy", () => {
  const ctx = setupTest({ startServer: true });

  describe("proxy()", () => {
    it("works", async () => {
      ctx.app.use("/hello", () => "hello");
      ctx.app.use("/", (event) => {
        return proxy(event, ctx.url + "/hello", { fetch });
      });

      const result = await ctx.fetch("/");

      expect(await result.text()).toBe("hello");
    });
  });

  describe("proxyRequest", () => {
    it("can proxy request", async () => {
      ctx.app.use("/debug", async (event) => {
        const headers = Object.fromEntries(event.request.headers.entries());
        const body = await event.request.text();
        return {
          method: event.request.method,
          headers,
          body,
        };
      });

      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", {
          fetch,
          headers: { "x-custom1": "overridden" },
          fetchOptions: {
            headers: { "x-custom2": "overridden" },
          },
        });
      });

      const result = await fetch(ctx.url + "/", {
        method: "POST",
        body: "hello",
        headers: {
          "content-type": "text/custom",
          "X-Custom1": "user",
          "X-Custom2": "user",
          "X-Custom3": "user",
        },
      }).then((r) => r.json());

      const { headers, ...data } = result;
      expect(headers["content-type"]).toEqual("text/custom");

      expect(headers["x-custom1"]).toEqual("overridden");
      expect(headers["x-custom2"]).toEqual("overridden");
      expect(headers["x-custom3"]).toEqual("user");

      expect(data).toMatchInlineSnapshot(`
        {
          "body": "hello",
          "method": "POST",
        }
      `);
    });

    it("can proxy binary request", async () => {
      ctx.app.use("/debug", async (event) => {
        const body = await event.request.arrayBuffer();
        return {
          headers: Object.fromEntries(event.request.headers.entries()),
          bytes: body.byteLength,
        };
      });

      ctx.app.use("/", (event) => {
        event.response.headers.set("x-res-header", "works");
        return proxyRequest(event, ctx.url + "/debug", { fetch });
      });

      const dummyFile = await readFile(
        new URL("assets/dummy.pdf", import.meta.url),
      );

      const res = await fetch(ctx.url + "/", {
        method: "POST",
        body: dummyFile,
        headers: {
          "x-req-header": "works",
        },
      });
      const resBody = await res.json();

      expect(res.headers.get("x-res-header")).toEqual("works");
      expect(resBody.headers["x-req-header"]).toEqual("works");
      expect(resBody.bytes).toEqual(dummyFile.length);
    });

    it("can proxy stream request", async () => {
      ctx.app.use("/debug", async (event) => {
        return {
          body: await event.request.text(),
          headers: Object.fromEntries(event.request.headers.entries()),
        };
      });

      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", { fetch });
      });

      const isNode16 = process.version.startsWith("v16.");
      const body = isNode16
        ? "This is a streamed request."
        : new ReadableStream({
            start(controller) {
              controller.enqueue("This ");
              controller.enqueue("is ");
              controller.enqueue("a ");
              controller.enqueue("streamed ");
              controller.enqueue("request.");
              controller.close();
            },
          }).pipeThrough(new TextEncoderStream());

      const res = await fetch(ctx.url + "/", {
        method: "POST",
        // @ts-ignore
        duplex: "half",
        body,
        headers: {
          "content-type": "application/octet-stream",
          "x-custom": "hello",
          "content-length": "27",
        },
      });
      expect(await res.json()).toMatchObject({
        body: "This is a streamed request.",
        headers: {
          "content-type": "application/octet-stream",
          "x-custom": "hello",
        },
      });
    });

    it("can proxy json transparently", async () => {
      const message = '{"hello":"world"}';

      ctx.app.use("/debug", (event) => {
        event.response.headers.set("content-type", "application/json");
        return message;
      });

      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", { fetch });
      });

      const res = await fetch(ctx.url + "/", {
        method: "GET",
      });

      const resText = await res.text();

      expect(resText).toEqual(message);
    });

    it(
      "can handle failed proxy requests gracefully",
      async () => {
        spy.mockReset();
        ctx.app.use("/", (event) => {
          return proxyRequest(
            event,
            "https://this-url-does-not-exist.absudiasdjadioasjdoiasd.test",
          );
        });

        await fetch(`${ctx.url}/`, {
          method: "GET",
        });

        expect(spy).not.toHaveBeenCalled();
      },
      60 * 1000,
    );
  });

  describe("multipleCookies", () => {
    it("can split multiple cookies", async () => {
      ctx.app.use("/setcookies", (event) => {
        setCookie(event, "user", "alice", {
          expires: new Date("Thu, 01 Jun 2023 10:00:00 GMT"),
          httpOnly: true,
        });
        setCookie(event, "role", "guest");
        return {};
      });

      ctx.app.use("/", (event) => {
        return proxy(event, ctx.url + "/setcookies", { fetch });
      });

      const result = await ctx.fetch("/");
      expect(result.headers.getSetCookie()).toEqual([
        "user=alice; Path=/; Expires=Thu, 01 Jun 2023 10:00:00 GMT; HttpOnly",
        "role=guest; Path=/",
      ]);
    });
  });

  describe("cookieDomainRewrite", () => {
    beforeEach(() => {
      ctx.app.use("/debug", (event) => {
        event.response.headers.set(
          "set-cookie",
          "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
        );
        return {};
      });
    });

    it("can rewrite cookie domain by string", async () => {
      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", {
          fetch,
          cookieDomainRewrite: "new.domain",
        });
      });

      const result = await fetch(ctx.url + "/");

      expect(result.headers.getSetCookie()[0]).toEqual(
        "foo=219ffwef9w0f; Domain=new.domain; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
      );
    });

    it("can rewrite cookie domain by mapper object", async () => {
      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", {
          fetch,
          cookieDomainRewrite: {
            "somecompany.co.uk": "new.domain",
          },
        });
      });

      const result = await fetch(ctx.url + "/");

      expect(result.headers.getSetCookie()[0]).toEqual(
        "foo=219ffwef9w0f; Domain=new.domain; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
      );
    });

    it("can rewrite domains of multiple cookies", async () => {
      ctx.app.use("/multiple/debug", (event) => {
        event.response.headers.append(
          "set-cookie",
          "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
        );
        event.response.headers.append(
          "set-cookie",
          "bar=38afes7a8; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
        );
        return {};
      });

      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/multiple/debug", {
          fetch,
          cookieDomainRewrite: {
            "somecompany.co.uk": "new.domain",
          },
        });
      });

      const result = await fetch(ctx.url + "/");

      expect(result.headers.getSetCookie()).toEqual([
        "foo=219ffwef9w0f; Domain=new.domain; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
        "bar=38afes7a8; Domain=new.domain; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
      ]);
    });

    it("can remove cookie domain", async () => {
      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", {
          fetch,
          cookieDomainRewrite: {
            "somecompany.co.uk": "",
          },
        });
      });

      const result = await fetch(ctx.url + "/");

      expect(result.headers.getSetCookie()[0]).toEqual(
        "foo=219ffwef9w0f; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
      );
    });
  });

  describe("cookiePathRewrite", () => {
    beforeEach(() => {
      ctx.app.use("/debug", (event) => {
        event.response.headers.set(
          "set-cookie",
          "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
        );
        return {};
      });
    });

    it("can rewrite cookie path by string", async () => {
      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", {
          fetch,
          cookiePathRewrite: "/api",
        });
      });

      const result = await fetch(ctx.url + "/");

      expect(result.headers.getSetCookie()[0]).toEqual(
        "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/api; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
      );
    });

    it("can rewrite cookie path by mapper object", async () => {
      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", {
          fetch,
          cookiePathRewrite: {
            "/": "/api",
          },
        });
      });

      const result = await fetch(ctx.url + "/");

      expect(result.headers.getSetCookie()[0]).toEqual(
        "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/api; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
      );
    });

    it("can rewrite paths of multiple cookies", async () => {
      ctx.app.use("/multiple/debug", (event) => {
        event.response.headers.append(
          "set-cookie",
          "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
        );
        event.response.headers.append(
          "set-cookie",
          "bar=38afes7a8; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
        );
        return {};
      });

      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/multiple/debug", {
          fetch,
          cookiePathRewrite: {
            "/": "/api",
          },
        });
      });

      const result = await fetch(ctx.url + "/");

      expect(result.headers.getSetCookie()).toEqual([
        "foo=219ffwef9w0f; Domain=somecompany.co.uk; Path=/api; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
        "bar=38afes7a8; Domain=somecompany.co.uk; Path=/api; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
      ]);
    });

    it("can remove cookie path", async () => {
      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", {
          fetch,
          cookiePathRewrite: {
            "/": "",
          },
        });
      });

      const result = await fetch(ctx.url + "/");

      expect(result.headers.getSetCookie()[0]).toEqual(
        "foo=219ffwef9w0f; Domain=somecompany.co.uk; Expires=Wed, 30 Aug 2022 00:00:00 GMT",
      );
    });
  });

  describe("onResponse", () => {
    beforeEach(() => {
      ctx.app.use("/debug", () => {
        return {
          foo: "bar",
        };
      });
    });

    it("allows modifying response event", async () => {
      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", {
          fetch,
          onResponse(event) {
            event.response.headers.set("x-custom", "hello");
          },
        });
      });

      const result = await ctx.fetch("/");

      expect(result.headers.get("x-custom")).toEqual("hello");
    });

    it("allows modifying response event async", async () => {
      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", {
          fetch,
          onResponse(_event) {
            return new Promise((resolve) => {
              resolve(event.response.headers.set("x-custom", "hello"));
            });
          },
        });
      });

      const result = await ctx.fetch("/");

      expect(result.headers.get("x-custom")).toEqual("hello");
    });

    it("allows to get the actual response", async () => {
      let headers;

      ctx.app.use("/", (event) => {
        return proxyRequest(event, ctx.url + "/debug", {
          fetch,
          onResponse(_event, response) {
            headers = Object.fromEntries(response.headers.entries());
          },
        });
      });

      await ctx.fetch("/");

      expect(headers?.["content-type"]).toEqual(
        "application/json; charset=utf-8",
      );
    });
  });
});
