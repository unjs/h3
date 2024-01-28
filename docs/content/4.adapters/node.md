---
title: Node
description: Adapte your H3 docs to Node.js without any effort.
---

An H3 app is agnostic to the runtime environment.

In order to start H3 apps in [Node.js](https://nodejs.org/), use `toNodeListener` adapter to convert h3 app into a [Node.js requestListener](https://nodejs.org/docs/latest/api/http.html#httpcreateserveroptions-requestlistener).

## From H3 to Node.js

First, create an H3 app:

```js [app.mjs]
import { createApp, defineEventHandler } from "h3";

export const app = createApp();

app.use(defineEventHandler(() => "Hello world!"));
```

Create Node.js server entry:

```js [server.mjs]
import { createServer } from "node:http";
import { toNodeListener } from "h3";
import { app } from "./app.mjs";

createServer(toNodeListener(app)).listen(process.env.PORT || 3000);
```

Now, you can run you H3 app natively with Node.js:

```bash [terminal]
node ./server.mjs
```

## From Node.js to H3

You can also convert a native Node.js requestListener into an H3 app using `fromNodeListener` adapter:

```js [app.mjs]
import NodeMiddleware from "node-middleware"; // This package doesn't exist, it's just an example
import { createApp, fromNodeMiddleware } from "h3";

export const app = createApp();

app.use(fromNodeListener(NodeMiddleware));
```

For example, this will help you to use [Vite Middleware mode](https://vitejs.dev/config/server-options.html#server-middlewaremode) with H3 apps.
