---
title: Bun
description:
---

In order to run H3 apps in [Bun](https://bun.sh/), use [Web Adapter](/runtimes/web).

**Note:** Alternatively you can use [Node.js setup](/runtimes/node) as Bun is fully compatible with Node.js API!

Create app entry:

```js [app.mjs]
import { createApp, eventHandler } from "h3";

export const app = createApp();

app.use(eventHandler(() => "Hello world!"));
```

Create Bun server entry:

```js [server.mjs]
import { toWebHandler } from "h3";
import { app } from "./app.mjs";

const server = Bun.serve({
  port: 3000,
  fetch: toWebHandler(app),
});
```

Run Bun server:

```bash [terminal]
bun --bun ./server.mjs
```
