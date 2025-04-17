import { H3, serve, getRouterParam, getRouterParams } from "h3";

export const app = new H3();

app
  .get("/:name", (event) => {
    const name = getRouterParam(event, "name");
    return `Hello ${name}`;
  })
  .get("/:name/:age", (event) => {
    const params = getRouterParams(event);

    return `Hello ${params.name}, you are ${params.age} years old`;
  });

await serve(app)
  .ready()
  .then((s) => console.log(`Server running at ${s.url}`));
