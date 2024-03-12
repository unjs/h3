import {
  createApp,
  createRouter,
  defineEventHandler,
  getRouterParam,
  getRouterParams,
} from "h3";

export const app = createApp();

const router = createRouter()
  .get(
    "/:name",
    defineEventHandler((event) => {
      const name = getRouterParam(event, "name");
      return `Hello ${name}`;
    }),
  )
  .get(
    "/:name/:age",
    defineEventHandler((event) => {
      const params = getRouterParams(event);

      return `Hello ${params.name}, you are ${params.age} years old`;
    }),
  );

app.use(router);
