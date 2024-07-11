import type { SessionConfig } from "../src/types";
import { describe, it, expect, beforeEach } from "vitest";
import { useSession, readJSONBody, createApp } from "../src";
import { setupTest } from "./_setup";

describe("session", () => {
  const ctx = setupTest();

  let router: ReturnType<typeof createApp>;

  let cookie = "";

  let sessionIdCtr = 0;
  const sessionConfig: SessionConfig = {
    name: "h3-test",
    password: "1234567123456712345671234567123456712345671234567",
    generateId: () => ++sessionIdCtr + "",
  };

  beforeEach(() => {
    router = createApp({});
    router.use("/", async (event) => {
      const session = await useSession(event, sessionConfig);
      if (event.method === "POST") {
        await session.update((await readJSONBody(event)) as any);
      }
      return { session };
    });
    ctx.app.use(router);
  });

  it("initiates session", async () => {
    const result = await ctx.request.get("/");
    expect(result.headers["set-cookie"]).toHaveLength(1);
    cookie = result.headers["set-cookie"][0];
    expect(result.body).toMatchObject({
      session: { id: "1", data: {} },
    });
  });

  it("gets same session back", async () => {
    const result = await ctx.request.get("/").set("Cookie", cookie);
    expect(result.body).toMatchObject({
      session: { id: "1", data: {} },
    });
  });

  it("set session data", async () => {
    const result = await ctx.request
      .post("/")
      .set("Cookie", cookie)
      .send({ foo: "bar" });
    cookie = result.headers["set-cookie"][0];
    expect(result.body).toMatchObject({
      session: { id: "1", data: { foo: "bar" } },
    });

    const result2 = await ctx.request.get("/").set("Cookie", cookie);
    expect(result2.body).toMatchObject({
      session: { id: "1", data: { foo: "bar" } },
    });
  });

  it("gets same session back (concurrent)", async () => {
    router.use("/concurrent", async (event) => {
      const sessions = await Promise.all(
        [1, 2, 3].map(() =>
          useSession(event, sessionConfig).then((s) => ({
            id: s.id,
            data: s.data,
          })),
        ),
      );
      return {
        sessions,
      };
    });
    const result = await ctx.request.get("/concurrent").set("Cookie", cookie);
    expect(result.body).toMatchObject({
      sessions: [1, 2, 3].map(() => ({ id: "1", data: { foo: "bar" } })),
    });
  });
});
