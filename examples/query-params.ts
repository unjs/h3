import { createH3, getQuery } from "h3";

export const app = createH3();

app.get("/", (event) => {
  const query = getQuery(event);
  return `Hello ${query.name}`;
});
