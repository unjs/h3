import { createApp, createRouter } from "h3";

export const app = createApp();

const router = createRouter()
  .get("/", () => "GET: hello world")
  .post("/", () => "POST: hello world")
  .put("/", () => "PUT: hello world")
  .delete("/", () => "DELETE: hello world")
  .patch("/", () => "PATCH: hello world")
  .head("/", () => "HEAD: hello world");

app.use(router);
