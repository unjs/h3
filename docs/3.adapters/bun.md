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
import { H3 } from "h3";

export const app = new H3();

app.use(() => "Hello world!");
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

## WebSocket support

:read-more{to="https://crossws.unjs.io/adapters/bun"}

```ts
import wsAdapter from "crossws/adapters/bun";

const { websocket, handleUpgrade } = wsAdapter(app.websocket);

const handler = toWebHandler(app);

const server = Bun.serve({
  port: 3000,
  websocket,
  fetch(req, server) {
    if (await handleUpgrade(req, server)) {
      return;
    }
    return handler(req);
  },
});
```
