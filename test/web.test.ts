import { getQuery } from "../src";
import { describeMatrix } from "./_setup";

describeMatrix("web", (t, { it, expect }) => {
  it("works", async () => {
    t.app.all("/test/**", async (event) => {
      const body = await event.request.text();
      event.response.status = 201;
      event.response.statusText = "Created";
      return {
        method: event.method,
        path: event.path,
        headers: Object.fromEntries(event.request.headers.entries()),
        query: getQuery(event),
        body,
        contextKeys: Object.keys(event.context),
      };
    });

    const res = await t.app.fetch("/test/foo/bar?test=123", {
      method: "POST",
      headers: {
        "X-Test": "true",
      },
      body: "request body",
      h3: {
        test: true,
      },
    });

    expect(res.status).toBe(201);
    expect(res.statusText).toBe("Created");
    expect([...res.headers.entries()]).toMatchObject([
      ["content-type", "application/json; charset=utf-8"],
    ]);

    expect(await res.json()).toMatchObject({
      method: "POST",
      path: "/test/foo/bar?test=123",
      body: "request body",
      headers: {
        "content-type": "text/plain;charset=UTF-8",
        "x-test": "true",
      },
      query: {
        test: "123",
      },
      contextKeys: ["test", "params", "matchedRoute"],
    });
  });
});
