import { createApp, defineEventHandler, toNodeListener } from "h3";

const app = createApp({ debug: true });

app.use(
  "/",
  defineEventHandler((event) => {
    return { message: "Hello World!" };
  })
);

export default toNodeListener(app);
