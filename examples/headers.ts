import { createH3 } from "h3";

export const app = createH3();

app.get("/user-agent", (event) => {
  const userAgent = event.headers.get("user-agent");

  event.response.setHeader("content-type", "text/plain");
  event.response.setHeader("x-server", "nitro");

  return {
    userAgent: userAgent,
    responseHeaders: Object.fromEntries(event.response.headers.entries()),
  };
});
