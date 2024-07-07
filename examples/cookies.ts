import { createApp, createRouter, getCookie, setCookie } from "h3";

export const app = createApp();

const router = createRouter()
  .get("/", (event) => {
    const testCookie = getCookie(event, "testCookie");
    return `testCookie is ${JSON.stringify(testCookie)} (go to /set to set it)`;
  })
  .get("/set", (event) => {
    // By default, path is set to `/`. You can use any of the options supported by the Set-Cookie header.
    // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
    setCookie(event, "testCookie", "bar", { httpOnly: true });
    return "testCookie is set";
  });

app.use(router);
