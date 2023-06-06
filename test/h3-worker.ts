import {
  adapterCloudflareWorker,
  createApp,
  createRouter,
  eventHandler,
} from "../src";

const app = createApp({ debug: false });
const router = createRouter();

router
  .get(
    "/",
    eventHandler((event) => {
      const response = new Response(`Hello world ! ${event.request.url}`);
      const { readable, writable } = new TransformStream();
      response.body?.pipeTo(writable);
      return new Response(readable, response);
    })
  )
  .get(
    "/here",
    eventHandler(() => {
      return new Response("Routed there");
    })
  );

app.use(router);

const cloudflare = adapterCloudflareWorker(app);
export default cloudflare;
