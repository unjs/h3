import { createServer } from "node:http";
import { promisify } from "node:util";
import { createApp, toNodeListener } from "../src";

export async function serverLambda (exec: (_app: ReturnType<typeof createApp>) => Promise<void>) {
  const app = createApp();
  const server = createServer(toNodeListener(app)).listen(3000);

  // Run the examples
  await exec(app);

  // Close the server and gracefully exit
  await promisify(server.close).bind(server)();
};
