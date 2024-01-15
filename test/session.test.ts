import supertest from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import {
  createApp,
  toNodeListener,
  App,
  eventHandler,
  useSession,
  readBody,
  SessionConfig,
} from "../src";

describe("session", () => {
  let app: App;
  let request: ReturnType<typeof supertest>;
  let cookie: string | undefined;

  beforeEach(() => {
    app = createApp({ debug: true });
    let sessionIdCtr = 0;
    const sessionConfig: SessionConfig = {
      name: "h3-test",
      password: "1234567123456712345671234567123456712345671234567",
      generateId: () => ++sessionIdCtr + "",
    };
    app.use(
      "/",
      eventHandler(async (event) => {
        const session = await useSession(event, sessionConfig);
        if (event.method === "POST") {
          await session.update(await readBody(event));
        }
        return { session };
      }),
    );
    request = supertest(toNodeListener(app));
  });

  describe("useSession", () => {
    it("initiates session", async () => {
      const result = await request.get("/");
      expect(result.headers["set-cookie"]).toHaveLength(1);
      cookie = result.headers["set-cookie"][0];
      expect(result.body).toMatchObject({
        session: { id: "1", data: {} },
      });
    });

    it("gets same session back", async () => {
      const result = await request.get("/");
      expect(result.body).toMatchObject({
        session: { id: "1", data: {} },
      });
    });

    it("set session data", async () => {
      const result = await request
        .post("/")
        .set("Cookie", cookie as string)
        .send({ foo: "bar" });
      cookie = result.headers["set-cookie"][0];
      expect(result.body).toMatchObject({
        session: { id: "1", data: { foo: "bar" } },
      });

      const result2 = await request.get("/").set("Cookie", cookie as string);
      expect(result2.body).toMatchObject({
        session: { id: "1", data: { foo: "bar" } },
      });
    });
  });
});
