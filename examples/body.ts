import { createApp, createRouter, readBody } from "h3";

export const app = createApp();

const router = createRouter()
  .get("/", () => "use POST method to try!")
  .post("/", async (event) => {
    const body = await readBody(event);
    // Use can also use `readFormData` to get a FormData object, `readMultiPartFormData` to get an array of MultiPartData or `readRawBody` to get a Buffer.
    return {
      body,
    };
  });

app.use(router);
