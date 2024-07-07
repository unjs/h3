import {
  createApp,
  createRouter,
  getResponseStatus,
  getResponseStatusText,
  noContent,
  setResponseStatus,
} from "h3";

export const app = createApp();

const router = createRouter()
  .get("/not-found", (event) => {
    setResponseStatus(event, 404);

    return "Not found"; // You need to explicitly return something to avoid a 404 'Cannot find any path matching "/not-found"' response.
  })
  .get("/bad-request", (event) => {
    setResponseStatus(event, 400, "Bad request message"); // You can customize the status message.

    const status = getResponseStatus(event); // You can get the status message.
    const text = getResponseStatusText(event); // You can get the status message.

    return {
      status,
      text,
    };
  })
  .get("/no-content", (event) => {
    // Do not need to explicitly return because `noContent` will cut the connection.
    return noContent(event);
  });

app.use(router);
