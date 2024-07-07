import { createApp, createError, createRouter } from "h3";

export const app = createApp({ debug: true });

const router = createRouter()
  .get("/", () => {
    // Always "throw" errors to propgate them to the error handler
    throw createError({ statusMessage: "Simple error!", statusCode: 301 });
  })
  .get("/complexe-error", () => {
    // You can fully customize errors by adding data, cause and if it's a fatal error or not
    throw createError({
      status: 400,
      message: "Bad request",
      statusMessage: "Bad request message",
    });
  })
  .get("/fatal-error", () => {
    // Fatal errors will stop the execution of the current request and will be logged
    throw createError({
      status: 500,
      message: "Fatal error",
      fatal: true,
      data: { foo: "bar" },
    });
  });

app.use(router);
