import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import {
  createApp,
  toNodeListener,
  App,
  readRawBody,
  readBody,
  eventHandler,
  readMultipartFormData,
} from "../src";

describe("", () => {
  let app: App;
  let request: SuperTest<Test>;

  beforeEach(() => {
    app = createApp({ debug: true });
    request = supertest(toNodeListener(app));
  });

  describe("readRawBody", () => {
    it("can handle raw string", async () => {
      app.use(
        "/",
        eventHandler(async (request) => {
          const body = await readRawBody(request);
          expect(body).toEqual('{"bool":true,"name":"string","number":1}');
          return "200";
        })
      );
      const result = await request.post("/api/test").send(
        JSON.stringify({
          bool: true,
          name: "string",
          number: 1,
        })
      );

      expect(result.text).toBe("200");
    });

    it("returns undefined if body is not present", async () => {
      let body = "initial";
      app.use(
        "/",
        eventHandler(async (request) => {
          body = await readRawBody(request);
          return "200";
        })
      );
      const result = await request.post("/api/test");

      expect(body).toBeUndefined();
      expect(result.text).toBe("200");
    });

    it("returns an empty string if body is empty", async () => {
      let body = "initial";
      app.use(
        "/",
        eventHandler(async (request) => {
          body = await readRawBody(request);
          return "200";
        })
      );
      const result = await request.post("/api/test").send('""');

      expect(body).toBe('""');
      expect(result.text).toBe("200");
    });

    it("returns an empty object string if body is empty object", async () => {
      let body = "initial";
      app.use(
        "/",
        eventHandler(async (request) => {
          body = await readRawBody(request);
          return "200";
        })
      );
      const result = await request.post("/api/test").send({});

      expect(body).toBe("{}");
      expect(result.text).toBe("200");
    });
  });

  describe("readBody", () => {
    it("can parse json payload", async () => {
      app.use(
        "/",
        eventHandler(async (request) => {
          const body = await readBody(request);
          expect(body).toMatchObject({
            bool: true,
            name: "string",
            number: 1,
          });
          return "200";
        })
      );
      const result = await request.post("/api/test").send({
        bool: true,
        name: "string",
        number: 1,
      });

      expect(result.text).toBe("200");
    });

    it("handles non-present body", async () => {
      let _body;
      app.use(
        "/",
        eventHandler(async (request) => {
          _body = await readBody(request);
          return "200";
        })
      );
      const result = await request.post("/api/test").send();
      expect(_body).toBeUndefined();
      expect(result.text).toBe("200");
    });

    it("handles empty body", async () => {
      let _body = "initial";
      app.use(
        "/",
        eventHandler(async (request) => {
          _body = await readBody(request);
          return "200";
        })
      );
      const result = await request
        .post("/api/test")
        .set("Content-Type", "text/plain")
        .send('""');
      expect(_body).toStrictEqual('""');
      expect(result.text).toBe("200");
    });

    it("handles empty object as body", async () => {
      let _body = "initial";
      app.use(
        "/",
        eventHandler(async (request) => {
          _body = await readBody(request);
          return "200";
        })
      );
      const result = await request.post("/api/test").send({});
      expect(_body).toStrictEqual({});
      expect(result.text).toBe("200");
    });

    it("parse the form encoded into an object", async () => {
      app.use(
        "/",
        eventHandler(async (request) => {
          const body = await readBody(request);
          expect(body).toMatchObject({
            field: "value",
            another: "true",
            number: ["20", "30", "40"],
          });
          return "200";
        })
      );
      const result = await request
        .post("/api/test")
        .set("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
        .send("field=value&another=true&number=20&number=30&number=40");

      expect(result.text).toBe("200");
    });

    it("handle readBody with buffer type (unenv)", async () => {
      app.use(
        "/",
        eventHandler(async (event) => {
          // Emulate unenv
          // @ts-ignore
          event.node.req.body = Buffer.from("test");

          const body = await readBody(event);
          expect(body).toMatchObject("test");

          return "200";
        })
      );

      const result = await request.post("/api/test").send();

      expect(result.text).toBe("200");
    });

    it("handle readBody with Object type (unenv)", async () => {
      app.use(
        "/",
        eventHandler(async (event) => {
          // Emulate unenv
          // @ts-ignore
          event.node.req.body = { test: 1 };

          const body = await readBody(event);
          expect(body).toMatchObject({ test: 1 });

          return "200";
        })
      );

      const result = await request.post("/api/test").send();

      expect(result.text).toBe("200");
    });

    it("handle readRawBody with array buffer type (unenv)", async () => {
      app.use(
        "/",
        eventHandler(async (event) => {
          // Emulate unenv
          // @ts-ignore
          event.node.req.body = new Uint8Array([1, 2, 3]);
          const body = await readRawBody(event, false);
          expect(body).toBeInstanceOf(Buffer);
          expect(body).toMatchObject(Buffer.from([1, 2, 3]));
          return "200";
        })
      );
      const result = await request.post("/api/test").send();
      expect(result.text).toBe("200");
    });

    it("parses multipart form data", async () => {
      app.use(
        "/",
        eventHandler(async (request) => {
          const parts = (await readMultipartFormData(request)) || [];
          return parts.map((part) => ({
            ...part,
            data: part.data.toString("utf8"),
          }));
        })
      );
      const result = await request
        .post("/api/test")
        .set(
          "content-type",
          "multipart/form-data; boundary=---------------------------12537827810750053901680552518"
        )
        .send(
          '-----------------------------12537827810750053901680552518\r\nContent-Disposition: form-data; name="baz"\r\n\r\nother\r\n-----------------------------12537827810750053901680552518\r\nContent-Disposition: form-data; name="号楼电表数据模版.xlsx"\r\n\r\nsomething\r\n-----------------------------12537827810750053901680552518--\r\n'
        );

      expect(result.body).toMatchInlineSnapshot(`
        [
          {
            "data": "other",
            "name": "baz",
          },
          {
            "data": "something",
            "name": "号楼电表数据模版.xlsx",
          },
        ]
      `);
    });

    it("returns undefined if body is not present with text/plain", async () => {
      let body;
      app.use(
        "/",
        eventHandler(async (request) => {
          body = await readBody(request);
          return "200";
        })
      );
      const result = await request
        .post("/api/test")
        .set("Content-Type", "text/plain");

      expect(body).toBeUndefined();
      expect(result.text).toBe("200");
    });

    it("returns undefined if body is not present with json", async () => {
      let body;
      app.use(
        "/",
        eventHandler(async (request) => {
          body = await readBody(request);
          return "200";
        })
      );
      const result = await request
        .post("/api/test")
        .set("Content-Type", "application/json");

      expect(body).toBeUndefined();
      expect(result.text).toBe("200");
    });

    it("returns the string if content type is text/*", async () => {
      let body;
      app.use(
        "/",
        eventHandler(async (request) => {
          body = await readBody(request);
          return "200";
        })
      );
      const result = await request
        .post("/api/test")
        .set("Content-Type", "text/*")
        .send('{ "hello": true }');

      expect(body).toBe('{ "hello": true }');
      expect(result.text).toBe("200");
    });

    it("returns string as is if cannot parse with unknown content type", async () => {
      app.use(
        "/",
        eventHandler(async (request) => {
          const _body = await readBody(request);
          return _body;
        })
      );
      const result = await request
        .post("/api/test")
        .set("Content-Type", "application/foobar")
        .send("{ test: 123 }");

      expect(result.statusCode).toBe(200);
      expect(result.text).toBe("{ test: 123 }");
    });

    it("fails if json is invalid", async () => {
      app.use(
        "/",
        eventHandler(async (request) => {
          const _body = await readBody(request);
          return _body;
        })
      );
      const result = await request
        .post("/api/test")
        .set("Content-Type", "application/json")
        .send('{ "hello": true');

      expect(result.statusCode).toBe(400);
      expect(result.body.statusMessage).toBe("Bad Request");
      expect(result.body.stack[0]).toBe("Error: Invalid JSON body");
    });
  });
});
