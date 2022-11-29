import { createServer } from "node:http";
import { promisify } from "node:util";
import { createApp, createRouter, eventHandler, toNodeListener } from "../../src";

// The following should be in a nuxt project
// Currently it creates a minimal server and attaches the middleware

const app = createApp();
app.use("/", eventHandler(() => "Hello world!"));

const router = createRouter();

// Equivalent to `app.use("/", router)`
app.use(router);

// Note: the following file uses top level awaits. This is not supported in older Node versions
// For more information, see https://v8.dev/features/top-level-await

const server = createServer(toNodeListener(app)).listen(3000);

await promisify(server.close)();
