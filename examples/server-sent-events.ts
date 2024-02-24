import { createApp, createRouter, eventHandler, createEventStream } from "h3";

export const app = createApp();

const router = createRouter();
app.use(router);

router.get(
  "/",
  eventHandler((event) => {
    const eventStream = createEventStream(event);

    // Send a message every second
    const interval = setInterval(async () => {
      await eventStream.push("Hello world");
    }, 1000);

    // cleanup the interval and close the stream when the connection is terminated
    eventStream.onClosed(async () => {
      clearInterval(interval);
      await eventStream.close();
    });

    return eventStream.send();
  }),
);
