import {
  createH3,
  defineEventHandler,
  defineRequestMiddleware,
  defineResponseMiddleware,
} from "h3";

export const app = createH3();

app.get(
  "/",
  defineEventHandler({
    onRequest: defineRequestMiddleware(() => {
      // Do anything you want here like authentication, rate limiting, etc.
      console.log("onRequest");
      // Never return anything from onRequest to avoid to close the connection
    }),
    onBeforeResponse: defineResponseMiddleware(() => {
      // Do anything you want here like logging, collecting metrics, or output compression, etc.
      console.log("onResponse");
      // Never return anything from onResponse to avoid to close the connection
    }),
    handler: () => "GET: hello world",
  }),
);
