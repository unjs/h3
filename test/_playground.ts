import { createServer } from "node:http";
import { createApp, createRouter, eventHandler, toNodeHandler } from "../src";

export const app = createApp();

const router = createRouter();
app.use(router);

router.get(
  "/",
  eventHandler(() => Buffer.from("<h1>Hello world!</h1>", "utf8")),
);

createServer(toNodeHandler(app)).listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
