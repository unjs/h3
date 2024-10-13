import { createH3, readBody } from "h3";

export const app = createH3();

app
  .get("/", () => "use POST method to try!")
  .post("/", async (event) => {
    const body = await readBody(event);
    // Use can also use `readFormDataBody` to get a FormData object, `readMultiPartFormData` to get an array of MultiPartData or `readRawBody` to get a Buffer.
    return {
      body,
    };
  });
