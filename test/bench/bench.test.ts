import { describe, it, expect } from "vitest";
import { requests, createBenchApps } from "./spec";

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
