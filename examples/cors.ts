import { createH3, handleCors } from "h3";

export const app = createH3();

app.use((event) => {
  if (
    handleCors(event, {
      origin: "*",
    })
  ) {
    return;
  }
});

app.get("/hello", () => "world");
