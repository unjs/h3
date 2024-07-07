import {
  createApp,
  createRouter,
  getRequestHeader,
  getResponseHeaders,
  setResponseHeader,
} from "h3";

export const app = createApp();

const router = createRouter().get("/user-agent", (event) => {
  const userAgent = getRequestHeader(event, "user-agent");
  // You can also use `getRequestHeaders` to get all headers at once.
  // const headers = getRequestHeaders(event)

  setResponseHeader(event, "content-type", "text/plain");
  setResponseHeader(event, "x-server", "nitro");
  // You can also use `setResponseHeaders` to set multiple headers at once.
  // setResponseHeaders(event, { 'x-server': 'nitro', 'content-type': 'text/plain' })

  const responseHeaders = getResponseHeaders(event);
  // You can also use `getResponseHeader` to get a single header.
  // const contentType = getResponseHeader(event, 'content-type')

  return {
    userAgent,
    responseHeaders,
  };
});

app.use(router);
