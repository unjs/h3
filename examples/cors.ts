import { createApp, createRouter, handleCors } from "h3";

export const app = createApp();

app.use((event) => {
  if (
    handleCors(event, {
      origin: "*",
    })
  ) {
    return;
  }
});

const router = createRouter().get("/hello", () => "world");

app.use(router);
