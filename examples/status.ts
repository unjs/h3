import { createH3, noContent } from "h3";

export const app = createH3();

app
  .get("/not-found", (event) => {
    event.response.status = 404;

    return "Not found"; // You need to explicitly return something to avoid a 404 'Cannot find any path matching "/not-found"' response.
  })
  .get("/bad-request", (event) => {
    const status = 400;
    const text = "Bad request message";

    event.response.status = status;
    event.response.statusText = text; // You can customize the status message.

    return {
      status,
      text,
    };
  })
  .get("/no-content", (event) => {
    return noContent(event);
  });
