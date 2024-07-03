import {
  createApp,
  createRouter,
  eventHandler,
  getQuery,
  getRequestHeaders,
} from "../../src";

export const app = createApp();

const router = createRouter();
app.use(router);

router.get(
  "/**",
  eventHandler((event) => {
    return {
      request: {
        method: event.method,
        path: event.path,
        params: getQuery(event),
        headers: getRequestHeaders(event),
      },
    };
  }),
);
