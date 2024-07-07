import { describe, it, expect, beforeEach, vi } from "vitest";
import { serveStatic } from "../src";
import { setupTest } from "./_setup";

describe("Serve Static", () => {
  const ctx = setupTest();

  beforeEach(() => {
    const serveStaticOptions = {
      getContents: vi.fn((id) =>
        id.includes("404") ? undefined : `asset:${id}`,
      ),
      getMeta: vi.fn((id) =>
        id.includes("404")
          ? undefined
          : {
              type: "text/plain",
              encoding: "utf8",
              etag: "w/123",
              mtime: 1_700_000_000_000,
              path: id,
              size: `asset:${id}`.length,
            },
      ),
      indexNames: ["/index.html"],
      encodings: { gzip: ".gz", br: ".br" },
    };

    ctx.app.use("/", (event) => {
      return serveStatic(event, serveStaticOptions);
    });
  });

  const expectedHeaders = {
    "content-type": "text/plain",
    etag: "w/123",
    "content-encoding": "utf8",
    "last-modified": new Date(1_700_000_000_000).toUTCString(),
    vary: "accept-encoding",
  };

  it("Can serve asset (GET)", async () => {
    const res = await ctx.request
      .get("/test.png")
      .set("if-none-match", "w/456")
      .set("if-modified-since", new Date(1_700_000_000_000 - 1).toUTCString())
      .set("accept-encoding", "gzip, br");

    expect(res.status).toEqual(200);
    expect(res.text).toBe("asset:/test.png.gz");
    expect(res.headers).toMatchObject(expectedHeaders);
    expect(res.headers["content-length"]).toBe("18");
  });

  it("Can serve asset (HEAD)", async () => {
    const headRes = await ctx.request
      .head("/test.png")
      .set("if-none-match", "w/456")
      .set("if-modified-since", new Date(1_700_000_000_000 - 1).toUTCString())
      .set("accept-encoding", "gzip, br");

    expect(headRes.status).toEqual(200);
    expect(headRes.text).toBeUndefined();
    expect(headRes.headers).toMatchObject(expectedHeaders);
    expect(headRes.headers["content-length"]).toBe("18");
  });

  it("Handles cache (if-none-match)", async () => {
    const res = await ctx.request
      .get("/test.png")
      .set("if-none-match", "w/123");
    expect(res.headers.etag).toBe(expectedHeaders.etag);
    expect(res.status).toEqual(304);
    expect(res.text).toBe("");
  });

  it("Handles cache (if-modified-since)", async () => {
    const res = await ctx.request
      .get("/test.png")
      .set("if-modified-since", new Date(1_700_000_000_001).toUTCString());
    expect(res.status).toEqual(304);
    expect(res.text).toBe("");
  });

  it("Returns 404 if not found", async () => {
    const res = await ctx.request.get("/404/test.png");
    expect(res.status).toEqual(404);

    const headRes = await ctx.request.head("/404/test.png");
    expect(headRes.status).toEqual(404);
  });

  it("Returns 405 if other methods used", async () => {
    const res = await ctx.request.post("/test.png");
    expect(res.status).toEqual(405);
  });
});
