import { createH3, getRouterParam, getRouterParams } from "h3";

export const app = createH3();

app
  .get("/:name", (event) => {
    const name = getRouterParam(event, "name");
    return `Hello ${name}`;
  })
  .get("/:name/:age", (event) => {
    const params = getRouterParams(event);

    return `Hello ${params.name}, you are ${params.age} years old`;
  });
