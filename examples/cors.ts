import { createH3, handleCors } from "h3";

export const app = createH3();

app.get("/hello", (event) => {
  if (handleCors(event, { origin: "*" })) {
    return;
  }
  return "Hello World!";
});
