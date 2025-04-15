import { createH3 } from "h3";

export const app = createH3();

app
  .get("/", () => "Try sending a POST request with a body!")
  .post("/", async (event) => {
    return {
      body: await event.req.text(),
    };
  });
