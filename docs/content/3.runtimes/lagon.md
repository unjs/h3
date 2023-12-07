---
title: Lagon
description:
---

You can directly host your H3 applications to [Lagon](https://lagon.app/) using [Web Adapter](/runtimes/web).

Create app entry:

```js [app.mjs]
import { createApp, eventHandler } from "h3";

export const app = createApp();

app.use(eventHandler(() => "Hello world!"));
```

Create entry for lagon deploy:

```js [lagon.mjs]
import { toWebHandler } from "h3";
import { app } from "./app.mjs";

export const handler = toWebHandler(app);
```

Use `lagon dev` to locally preview:

```bash [terminal]
npx lagon dev ./lagon.mjs
```

Use `lagon deploy` to deploy:

```bash [terminal]
npx lagon deploy --prod ./lagon.mjs
```

👉 See [pi0/h3-on-edge](https://github.com/pi0/h3-on-edge) demo for a fully working example ([deployment](https://h3-on-edge.lagon.dev/)).
