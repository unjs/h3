import {
  createApp,
  createRouter,
  getQuery,
  getRequestHeaders,
} from "../../src";

export const app = createApp();

const router = createRouter();
app.use(router);

router.get("/**", (event) => {
  return {
    request: {
      method: event.request.method,
      path: event.path,
      params: getQuery(event),
      headers: getRequestHeaders(event),
    },
  };
});
