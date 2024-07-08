import { bench, describe } from "vitest";
import { requests, createBenchApps } from "./spec";

const apps = createBenchApps();

for (const request of requests) {
  describe(`[${request.method}] ${request.path}`, () => {
    for (const [name, _fetch] of apps) {
      bench(name, async () => {
        await _fetch(
          new Request(`http://localhost${request.path}`, {
            method: request.method,
            body: request.body,
          }),
        );
      });
    }
  });
}
