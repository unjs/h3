import { createApp, defineEventHandler, toNodeListener } from "../src";

const app = createApp({ debug: true });

app.use(
  "/",
  defineEventHandler((event) => {
    return { message: "Hello World!" };
  })
);

export default toNodeListener(app);
