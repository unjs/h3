import { describe, it, expect } from "vitest";
import { createRouter, createApp, readJSONBody, toWebHandler } from "../src";
import { getQuery } from "../src/utils/request";
import { setResponseHeader } from "../src/utils/response";

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

describe("benchmark", () => {
  const apps = createBenchApps();

  describe("app works as expected", () => {
    for (const [name, _fetch] of apps) {
      for (const request of requests) {
        it(`[${name}] [${request.method}] ${request.path}`, async () => {
          const response = await _fetch(
            new Request(`http://localhost${request.path}`, {
              method: request.method,
              body: request.body,
            }),
          );
          expect(response.status).toBe(200);
          if (request.response.body) {
            expect(await response.text()).toBe(request.response.body);
          }
          if (request.response.headers) {
            for (const [key, value] of Object.entries(
              request.response.headers,
            )) {
              expect(response.headers.get(key)).toBe(value);
            }
          }
        });
      }
    }
  });
});

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
