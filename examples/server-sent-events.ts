import { createApp, createRouter, eventHandler, createEventStream } from "h3";

const app = createApp();
const router = createRouter();

router.get(
  "/sse",
  eventHandler((event) => {
    const eventStream = createEventStream(event);
    eventStream.start();

    // send a message every second
    const interval = setInterval(async () => {
      await eventStream.push({
        data: "Hello World",
      });
    }, 1000);

    // cleanup when the client disconnects
    eventStream.on("disconnect", () => {
      clearInterval(interval);
    });
  }),
);

app.use(router);
