import { bench, summary, run } from "mitata";
import { requests } from "./input.mjs";

import * as _dist from "../../dist/index.mjs";
import * as _nightly from "h3-nightly";

const preparedRequests = requests.map((request) => {
  return new Request(`http://localhost${request.path}`, {
    method: request.method,
    body: request.body,
  });
});

summary(async () => {
  for (const [name, { createH3, getQuery }] of Object.entries({
    _dist,
    _nightly,
  })) {
    bench(name, function* () {
      const app = createH3()
        .get("/", () => "Hi")
        .get("/id/:id", (event) => {
          event.response.setHeader("x-powered-by", "benchmark");
          return `${event.context.params.id} ${getQuery(event).name}`;
        })
        .post("/json", (event) => event.request.json());

      yield async () => {
        await Promise.all(preparedRequests.map((req) => app.fetch(req)));
      };
    }).gc("inner");
  }
});

await run({ throw: true });
