import { createApp, createRouter, defineEventHandler, handleCors } from "h3";

export const app = createApp();

const corsHandler = defineEventHandler((event) => {
  if (
    handleCors(event, {
      origin: "*",
    })
  ) {
    return;
  }
});

app.use(corsHandler);

const router = createRouter().get(
  "/hello",
  defineEventHandler(() => {
    return "world";
  }),
);

app.use(router);
