import * as _h3src from "../../src";
import * as _h3v1 from "h3-v1";
import * as _h3nightly from "h3-nightly";

export function createInstances() {
  return [
    ["h3", h3(_h3src)],
    ["h3-nightly", h3(_h3nightly as any)],
    // ["h3-middleware", h3Middleware(_h3src)],
    // ["h3-v1", h3v1()],
    // ["std", std()],
  ] as const;
}

export function h3(lib: typeof _h3src) {
  const app = lib.createH3();

  // [GET] /
  app.get("/", () => "Hi");

  // [GET] /id/:id
  app.get("/id/:id", (event) => {
    event.response.setHeader("x-powered-by", "benchmark");
    const { name } = lib.getQuery(event);
    return `${event.context.params!.id} ${name}`;
  });

  // [POST] /json
  app.post("/json", (event) => event.request.json());

  return app.fetch;
}

export function h3Nightly(lib: typeof _h3nightly) {
  const app = lib.createH3();

  // [GET] /
  app.get("/", () => "Hi");

  // [GET] /id/:id
  app.get("/id/:id", (event) => {
    event.response.setHeader("x-powered-by", "benchmark");
    const name = event.searchParams.get("name");
    return `${event.context.params!.id} ${name}`;
  });

  // [POST] /json
  app.post("/json", (event) => event.request.json());

  return app.fetch;
}

export function h3Middleware(lib: typeof _h3src) {
  const app = lib.createH3();

  // Global middleware
  app.use(() => {});
  app.use(() => Promise.resolve());

  // [GET] /
  app.use("/", () => "Hi");

  // [GET] /id/:id
  app.use("/id/:id", (event) => {
    event.response.setHeader("x-powered-by", "benchmark");
    return `${event.context.params!.id} ${event.url.searchParams.get("name")}`;
  });

  // [POST] /json
  app.use("/json", (event) => event.request.json());

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

export function std() {
  return function (req: Request): Response | Promise<Response> {
    const url = new URL(req.url);
    switch (req.method) {
      case "GET": {
        if (url.pathname === "/") {
          return new Response("Hi");
        }
        if (url.pathname.startsWith("/id/")) {
          const id = url.pathname.slice(4);
          const name = url.searchParams.get("name");
          return new Response(`${id} ${name}`, {
            headers: {
              "x-powered-by": "benchmark",
            },
          });
        }
        break;
      }
      case "POST": {
        if (url.pathname === "/json") {
          return req.json().then((body) => new Response(JSON.stringify(body)));
        }
        break;
      }
    }
    return new Response("Not Found", { status: 404 });
  };
}
