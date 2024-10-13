import { createH3 } from "h3";

export const app = createH3();

app.get("/user-agent", (event) => {
  const userAgent = event.request.headers.get("user-agent");

  event.response.headers.set("content-type", "text/plain");
  event.response.headers.set("x-server", "nitro");

  const responseHeaders = Object.fromEntries(event.response.headers.entries());

  return {
    userAgent,
    responseHeaders,
  };
});
