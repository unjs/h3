import { createApp, defineEventHandler } from "h3";

export const app = createApp();

app
  // `/` is the root path and will response to every request.
  .use(
    "/first-request",
    defineEventHandler(() => {
      return "hello world";
    }),
  )
  .use(
    "/hello",
    defineEventHandler(() => {
      return "world";
    }),
  )
  .use(
    "/json",
    defineEventHandler(() => {
      // Automatically set the `Content-Type` header to `application/json`.
      return {
        hello: "world",
      };
    }),
  )
  .use(
    "/html",
    defineEventHandler(() => {
      // By default, the `Content-Type` header is set to `text/html`.
      return "<h1>hello world</h1>";
    }),
  )
  .use(
    "/buffer",
    defineEventHandler(() => {
      // No `Content-Type` header is set by default. You can set it manually using `setHeader`.
      return Buffer.from("hello world");
    }),
  )
  .use(
    "/blob",
    defineEventHandler(() => {
      // No `Content-Type` header is set by default. You can set it manually using `setHeader`.
      return new Blob(["hello world"]);
    }),
  );
