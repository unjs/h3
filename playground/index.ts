import { listen } from "listhen";
import { fetch } from "node-fetch-native";
import { createApp, createRouter, eventHandler, toNodeListener, parseCookies, createError, proxyRequest } from "../src";

const app = createApp({ debug: true });
const router = createRouter()
  .get("/", eventHandler(event => proxyRequest(event, "http://icanhazip.com", {
    fetch
  })))
  .get("/error/:code", eventHandler((event) => {
    throw createError({ statusCode: Number.parseInt(event.context.params.code) });
  }))
  .get("/hello/:name", eventHandler((event) => {
    return `Hello ${parseCookies(event)}!`;
  }));

app.use(router);

listen(toNodeListener(app));
