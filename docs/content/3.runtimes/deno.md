---
title: Deno Deploy
description:
---

You can directly host your H3 applications to [Deno Deploy](https://deno.com/deploy) using [Web Adapter](/runtimes/web).

Create app entry:

```js [app.mjs]
import { createApp, eventHandler } from "h3";

export const app = createApp();

app.use(eventHandler(() => "Hello world!"));
```

Create entry for deno deploy:

```js [deno.mjs]
import { toWebHandler } from "h3";
import { app } from "./app.mjs";

Deno.serve(toWebHandler(app));
```

Create `import_map.json`:

```json [import_map.json]
{
  "imports": {
    "h3": "https://esm.sh/h3@latest"
  }
}
```

Use `deno run` to locally preview:

```bash [terminal]
deno run --allow-net ./deno.mjs
```

Use `deployctl deploy` to deploy:

```bash [terminal]
deployctl deploy --prod --exclude=node_modules --import-map=./import_map.json ./deno.mjs
```

👉 See [pi0/h3-on-edge](https://github.com/pi0/h3-on-edge) demo for a fully working example ([deployment](https://h3-on-edge.deno.dev/)).
