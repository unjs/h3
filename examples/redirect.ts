import { createApp, createRouter, sendRedirect } from "h3";

export const app = createApp();

const router = createRouter()
  .get("/unjs", (event) => {
    return sendRedirect(event, "https://unjs.io/packages/h3"); // 302 Found by default
  })
  .get("/permanent", (event) => {
    // You can use any 3xx status code you want
    return sendRedirect(event, "https://unjs.io/packages/h3", 301);
  });

app.use(router);
