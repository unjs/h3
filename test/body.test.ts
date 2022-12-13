import supertest, { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
<<<<<<< HEAD
import {
  createApp,
  toNodeListener,
  App,
  readRawBody,
  readBody,
  eventHandler,
} from "../src";
=======
import { createApp, toNodeListener, App, readRawBody, readBody, eventHandler, readMultipartFormData } from "../src";
>>>>>>> 88ad829 (feat: add helper to parse `multipart/form-data`)

describe("", () => {
  let app: App;
  let request: SuperTest<Test>;

  beforeEach(() => {
    app = createApp({ debug: true });
    request = supertest(toNodeListener(app));
  });

  describe("useRawBody", () => {
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
      let body: string | undefined = "initial";
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
      let body: string | undefined = "initial";
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
      let body: string | undefined = "initial";
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
      let _body = "initial";
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
      expect(_body).toStrictEqual("");
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
        .send("field=value&another=true&number=20&number=30&number=40");

      expect(result.text).toBe("200");
    });

    it("parses multipart form data", async () => {
      app.use("/", eventHandler(async (request) => {
        const body = await readMultipartFormData(request);
        expect(body!.map(b => b.name)).toMatchObject(["baz", "bar"]);
        return "200";
      }));
      const result = await request.post("/api/test")
        .set("content-type", "multipart/form-data; boundary=---------------------------12537827810750053901680552518")
        .send("-----------------------------12537827810750053901680552518\r\nContent-Disposition: form-data; name=\"baz\"\r\n\r\nother\r\n-----------------------------12537827810750053901680552518\r\nContent-Disposition: form-data; name=\"bar\"\r\n\r\nsomething\r\n-----------------------------12537827810750053901680552518--\r\n");

      expect(result.text).toBe("200");
    });
  });
});
