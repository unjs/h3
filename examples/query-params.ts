import { createApp, createRouter, defineEventHandler, getQuery } from "h3";

export const app = createApp();

const router = createRouter().get(
  "/",
  defineEventHandler((event) => {
    const query = getQuery(event);

    if (!query.name) {
      return "Set ?name=yourname in URL to get a greeting!";
    }

    return `Hello ${query.name}`;
  }),
);

app.use(router);
