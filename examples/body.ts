import { createApp, createRouter, readJSONBody } from "h3";

export const app = createApp();

const router = createRouter()
  .get("/", () => "use GET method to try!")
  .post("/", async (event) => {
    const body = await readJSONBody(event);
    // You can also use `readFormDataBody` to get a FormData object, `readMultiPartFormData` to get an array of MultiPartData or `readRawBody` to get a Buffer.
    return {
      body,
    };
  });

app.use(router);
