import { bench, group as describe, run } from "mitata";
import { requests } from "./input";
import { createInstances } from "./impl";

const runAll = process.argv.includes("--all");

const instances = createInstances();

describe("all", async () => {
  for (const [name, _fetch] of instances) {
    bench(name, async () => {
      await Promise.all(
        requests.map((request) =>
          _fetch(
            new Request(`http://localhost${request.path}`, {
              method: request.method,
              body: request.body,
            }),
          ),
        ),
      );
    });
  }
});

if (runAll) {
  for (const request of requests) {
    describe(`[${request.method}] ${request.path}`, () => {
      for (const [name, _fetch] of instances) {
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
}

await run();
