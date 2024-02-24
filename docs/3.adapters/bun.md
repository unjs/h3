---
icon: simple-icons:bun
---

# Bun

> Run your h3 apps with Bun

In order to run h3 apps in [Bun](https://bun.sh/), use the [Web Adapter](/adapters/web).

> [!NOTE]
> Alternatively you can use [Node.js adapter](/adapters/node) as Bun is fully compatible with Node.js API!

## Usage

Create app entry:

```js [app.mjs]
import { createApp, defineEventHandler } from "h3";

export const app = createApp();

app.use(defineEventHandler(() => "Hello world!"));
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

Now, your can run Bun server:

```bash
bun --bun ./server.mjs
```
