import { createApp, createRouter, eventHandler, createEventStream } from "h3";

const app = createApp();
const router = createRouter();

router.get(
  "/sse",
  eventHandler((event) => {
    const eventStream = createEventStream(event);

    // send a message every second
    const interval = setInterval(async () => {
      await eventStream.push("Hello world");
    }, 1000);

    // cleanup the interval and close the stream when the connection is terminated
    eventStream.on("request:close", async () => {
      clearInterval(interval);
      await eventStream.close();
    });

    return eventStream;
  }),
);

router.get(
  "/sse-autoclose",
  eventHandler((event) => {
    // set autoclose to true
    const eventStream = createEventStream(event, true);

    // send a message every second
    const interval = setInterval(async () => {
      await eventStream.push({
        data: "Hello World",
      });
    }, 1000);

    // the stream gets automatically closed when the connection is terminated
    // so only the interval needs to be cleaned up
    eventStream.on("close", () => {
      clearInterval(interval);
    });

    // send the eventStream to the client
    return eventStream;
  }),
);

app.use(router);
