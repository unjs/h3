import { createH3 } from "h3";

export const app = createH3();

app.get("/", (event) => {
  return `Hello ${event.url.searchParams.get("name") || "anonymous"}!`;
});
