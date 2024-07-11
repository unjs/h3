import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, it, expect } from "vitest";
import { readTextBody, readJSONBody, readFormDataBody } from "../src";
import { setupTest } from "./_setup";

describe("body", () => {
  const ctx = setupTest({ startServer: true });

  it("can read simple string", async () => {
    ctx.app.use("/api/test", async (request) => {
      const body = await readTextBody(request);
      expect(body).toEqual('{"bool":true,"name":"string","number":1}');
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      body: JSON.stringify({
        bool: true,
        name: "string",
        number: 1,
      }),
    });

    expect(await result.body.text()).toBe("200");
  });

  it("can read chunked string", async () => {
    const requestJsonUrl = new URL("assets/sample.json", import.meta.url);
    ctx.app.use("/api/test", async (request) => {
      const body = await readTextBody(request);
      const json = (await readFile(requestJsonUrl)).toString("utf8");

      expect(body).toEqual(json);
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      body: createReadStream(requestJsonUrl),
    });

    expect(await result.body.text()).toBe("200");
  });

  it("returns undefined if body is not present", async () => {
    let _body: string | undefined = "initial";
    ctx.app.use("/api/test", async (request) => {
      _body = await readTextBody(request);
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
    });

    expect(_body).toBeUndefined();
    expect(await result.body.text()).toBe("200");
  });

  it("returns an empty string if body is string", async () => {
    let _body: string | undefined = "initial";
    ctx.app.use("/api/test", async (request) => {
      _body = await readJSONBody(request);
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      body: '""',
    });

    expect(_body).toBe("");
    expect(await result.body.text()).toBe("200");
  });

  it("returns an empty object string if body is empty object", async () => {
    let _body: string | undefined = "initial";
    ctx.app.use("/api/test", async (request) => {
      _body = await readTextBody(request);
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      body: "{}",
    });

    expect(_body).toBe("{}");
    expect(await result.body.text()).toBe("200");
  });

  it("can parse json payload", async () => {
    ctx.app.use("/api/test", async (request) => {
      const body = await readJSONBody(request);
      expect(body).toMatchObject({
        bool: true,
        name: "string",
        number: 1,
      });
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      body: JSON.stringify({
        bool: true,
        name: "string",
        number: 1,
      }),
    });

    expect(await result.body.text()).toBe("200");
  });

  it("handles non-present body", async () => {
    let _body: string | undefined;
    ctx.app.use("/api/test", async (request) => {
      _body = await readJSONBody(request);
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
    });
    expect(_body).toBeUndefined();
    expect(await result.body.text()).toBe("200");
  });

  it("handles empty body", async () => {
    let _body: string | undefined = "initial";
    ctx.app.use("/api/test", async (request) => {
      _body = await readTextBody(request);
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: '""',
    });
    expect(_body).toStrictEqual('""');
    expect(await result.body.text()).toBe("200");
  });

  it("handles empty object as body", async () => {
    let _body: string | undefined = "initial";
    ctx.app.use("/api/test", async (request) => {
      _body = await readJSONBody(request);
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      body: "{}",
    });
    expect(_body).toStrictEqual({});
    expect(await result.body.text()).toBe("200");
  });

  it("parse the form encoded into an object", async () => {
    ctx.app.use("/api/test", async (request) => {
      const body = await readJSONBody(request);
      expect(body).toMatchObject({
        field: "value",
        another: "true",
        number: ["20", "30", "40"],
      });
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: "field=value&another=true&number=20&number=30&number=40",
    });

    expect(await result.body.text()).toBe("200");
  });

  it("parses multipart form data", async () => {
    ctx.app.use("/api/test", async (request) => {
      const formData = await readFormDataBody(request);
      return [...formData!.entries()].map(([name, value]) => ({
        name,
        data: value,
      }));
    });

    const formData = new FormData();
    formData.append("baz", "other");
    formData.append("号楼电表数据模版.xlsx", "something");

    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      headers: {
        "content-type":
          "multipart/form-data; boundary=---------------------------12537827810750053901680552518",
      },
      body: '-----------------------------12537827810750053901680552518\r\nContent-Disposition: form-data; name="baz"\r\n\r\nother\r\n-----------------------------12537827810750053901680552518\r\nContent-Disposition: form-data; name="号楼电表数据模版.xlsx"\r\n\r\nsomething\r\n-----------------------------12537827810750053901680552518--\r\n',
    });

    expect(await result.body.json()).toMatchInlineSnapshot(`
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
    let _body: string | undefined;
    ctx.app.use("/api/test", async (request) => {
      _body = await readTextBody(request);
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
    });

    expect(_body).toBeUndefined();
    expect(await result.body.text()).toBe("200");
  });

  it("returns undefined if body is not present with json", async () => {
    let _body: string | undefined;
    ctx.app.use("/api/test", async (request) => {
      _body = await readTextBody(request);
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(_body).toBeUndefined();
    expect(await result.body.text()).toBe("200");
  });

  it("returns the string if content type is text/*", async () => {
    let _body: string | undefined;
    ctx.app.use("/api/test", async (request) => {
      _body = await readTextBody(request);
      return "200";
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      headers: {
        "Content-Type": "text/*",
      },
      body: '{ "hello": true }',
    });

    expect(_body).toBe('{ "hello": true }');
    expect(await result.body.text()).toBe("200");
  });

  it("returns string as is if cannot parse with unknown content type", async () => {
    ctx.app.use("/api/test", async (request) => {
      const _body = await readTextBody(request);
      return _body;
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      headers: {
        "Content-Type": "application/foobar",
      },
      body: "{ test: 123 }",
    });

    expect(result.statusCode).toBe(200);
    expect(await result.body.text()).toBe("{ test: 123 }");
  });

  it("fails if json is invalid", async () => {
    ctx.app.use("/api/test", async (request) => {
      const _body = await readJSONBody(request);
      return _body;
    });
    const result = await ctx.client!.request({
      path: "/api/test",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: '{ "hello": true',
    });
    const resultJson = (await result.body.json()) as any;

    expect(result.statusCode).toBe(400);
    expect(resultJson.statusMessage).toBe("Bad Request");
    expect(resultJson.stack[0]).toBe("Error: Invalid JSON body");
  });
});
