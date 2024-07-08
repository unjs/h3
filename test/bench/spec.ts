import {
  createRouter,
  createApp,
  readJSONBody,
  toWebHandler,
  getQuery,
  setResponseHeader,
} from "../../src";

// https://github.com/pi0/web-framework-benchmarks
// https://github.com/SaltyAom/bun-http-framework-benchmark

export const requests = [
  {
    method: "GET",
    path: "/",
    response: {
      body: "Hi",
    },
  },
  {
    method: "GET",
    path: "/id/id?foo=bar&name=name&bar=baz",
    response: {
      body: "id name",
      headers: {
        "x-powered-by": "benchmark",
      },
    },
  },
  {
    method: "POST",
    path: "/json",
    body: `{"hello":"world"}`,
    response: {
      body: `{"hello":"world"}`,
    },
  },
];

export function createBenchApps() {
  return [
    ["h3", createH3App()],
    ["baseline", createBaselineApp()],
  ] as const;
}

export function createH3App() {
  const router = createRouter();
  const app = createApp().use(router);

  // [GET] /
  router.get("/", () => "Hi");

  // [GET] /id/:id
  router.get("/id/:id", (event) => {
    const query = getQuery(event);
    setResponseHeader(event, "x-powered-by", "benchmark");
    return `${event.context.params!.id} ${query.name}`;
  });

  // [POST] /json
  router.post("/json", (event) => readJSONBody(event));

  return toWebHandler(app);
}

export function createBaselineApp() {
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
