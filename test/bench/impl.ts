import * as _h3src from "../../src";
import * as _h3v1 from "h3-v1";

export function createInstances() {
  return [
    ["h3", h3(_h3src)],
    ["h3-v1", h3v1()],
    ["maximum", fastest()],
  ] as const;
}

export function h3(lib: typeof _h3src) {
  const app = lib.createH3();

  // [GET] /
  app.get("/", () => "Hi");

  // [GET] /id/:id
  app.get("/id/:id", (event) => {
    const query = lib.getQuery(event);
    lib.setResponseHeader(event, "x-powered-by", "benchmark");
    return `${event.context.params!.id} ${query.name}`;
  });

  // [POST] /json
  app.post("/json", (event) => lib.readJSONBody(event));

  return app.fetch;
}

export function h3v1() {
  const router = _h3v1.createRouter();
  const app = _h3v1.createApp();
  app.use(router);

  // [GET] /
  router.get(
    "/",
    _h3v1.eventHandler(() => "Hi"),
  );

  // [GET] /id/:id
  router.get(
    "/id/:id",
    _h3v1.eventHandler((event) => {
      const query = _h3v1.getQuery(event);
      _h3v1.setResponseHeader(event, "x-powered-by", "benchmark");
      return `${event.context.params!.id} ${query.name}`;
    }),
  );

  // [POST] /json
  router.post(
    "/json",
    _h3v1.eventHandler((event) => _h3v1.readBody(event)),
  );

  return _h3v1.toWebHandler(app);
}

export function fastest() {
  return function (req: Request): Response {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") {
      return new Response("Hi");
    }
    if (req.method === "GET" && url.pathname.startsWith("/id/")) {
      const id = url.pathname.slice(4);
      const name = url.searchParams.get("name");
      return new Response(`${id} ${name}`, {
        headers: {
          "x-powered-by": "benchmark",
        },
      });
    }
    if (req.method === "POST" && url.pathname === "/json") {
      return new Response(`{"hello":"world"}`);
    }
    return new Response("Not Found", { status: 404 });
  };
}
