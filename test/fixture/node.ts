import { createServer } from "node:http";
import { toNodeHandler } from "../../src";
import { app } from "./app";

createServer(toNodeHandler(app)).listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
