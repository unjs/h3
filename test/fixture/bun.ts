import { toWebHandler } from "../../src";
import { app } from "./app";

export default {
  fetch: toWebHandler(app),
};
