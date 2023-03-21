import { listen } from "listhen";
import { fetch } from "node-fetch-native";
import {
  createApp,
  createRouter,
  eventHandler,
  toNodeListener,
  createError,
  proxyRequest,
  useSession,
} from "../src";

const app = createApp({ debug: true });
const router = createRouter()
  .get(
    "/",
    eventHandler((event) =>
      proxyRequest(event, "http://icanhazip.com", {
        fetch,
      })
    )
  )
  .get(
    "/error/:code",
    eventHandler((event) => {
      throw createError({
        statusCode: Number.parseInt(event.context.params?.code || ""),
      });
    })
  )
  .get(
    "/hello/:name",
    eventHandler(async (event) => {
      const password = "secretsecretsecretsecretsecretsecretsecret";
      const session = await useSession<{ ctr: number }>(event, {
        password,
        maxAge: 5,
      });
      await session.update((data) => ({ ctr: Number(data.ctr || 0) + 2 }));
      await session.update({ ctr: Number(session.data.ctr || 0) - 1 });
      return `Hello ${event.context.params?.name}! (you visited this page ${session.data.ctr} times. session id: ${session.id})`;
    })
  );

app.use(router);

listen(toNodeListener(app));
