import { createH3, getQuery } from "../../src";

export const app = createH3();

app.get("/**", (event) => {
  return {
    request: {
      method: event.request.method,
      path: event.path,
      params: getQuery(event),
      headers: Object.fromEntries(event.request.headers.entries()),
    },
  };
});
