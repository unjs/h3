import { createApp, eventHandler, toWebHandler } from "h3";

// Create App Instance
const app = createApp();
app.use(eventHandler(() => "Hello world!"));

// Create Web Adapter
const handler = toWebHandler(app);

// Test Adapter
const response = await handler(new Request(new URL("/", "http://localhost")));
console.log(await response.text()); // Hello world!
