import { createApp, createRouter, getQuery } from "h3";

export const app = createApp();

const router = createRouter().get("/", (event) => {
  const query = getQuery(event);
  return `Hello ${query.name}`;
});

app.use(router);
