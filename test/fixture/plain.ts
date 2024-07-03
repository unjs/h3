import { toPlainHandler } from "../../src";
import { app } from "./app";

const plainHandler = toPlainHandler(app);

const res = await plainHandler({
  path: "/",
  method: "GET",
  headers: {
    foo: "bar",
  },
  body: undefined,
});

console.log(res);
