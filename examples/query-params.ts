import { createApp, createRouter, getQuery } from "h3";

export const app = createApp();

const router = createRouter().get("/", (event) => {
  const query = getQuery(event);

  if (!query.name) "Set ?name=yourname in URL to get a greeting!";

  return `Hello ${query.name}`;
});

app.use(router);
