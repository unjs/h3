import { H3, serve, handleCors } from "h3";

export const app = new H3();

app.get("/hello", (event) => {
  if (handleCors(event, { origin: "*" })) {
    return;
  }
  return "Hello World!";
});

await serve(app)
  .ready()
  .then((s) => console.log(`Server running at ${s.url}`));
