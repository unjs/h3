---
title: Netlify
description: Run your H3 apps in Netlify Edge
---

You can directly host your H3 applications to [Netlify Edge](https://www.netlify.com/platform/core/edge/) using [Web Adapter](/adapters/web).

Create app entry:

```js [app.mjs]
import { createApp, eventHandler } from "h3";

export const app = createApp();

app.use(eventHandler(() => "Hello world!"));
```

Create entry for netlify-edge:

```js [netlify/index.mjs]
import { toWebHandler } from "h3";
import { app } from "./app.mjs";

export const handler = toWebHandler(app);
```

Create `import_map.json`:

```json [import_map.json]
{
  "imports": {
    "h3": "https://esm.sh/h3@latest"
  }
}
```

Create `netlify.toml`:

```toml [netlify.toml]
[build]
  edge_functions = "netlify"

[functions]
  deno_import_map = "./import_map.json"
```

Use `netlify dev` to locally preview:

```bash [terminal]
npx netlify dev
```

Use `netlify deploy` to deploy:

```bash [terminal]
npx netlify deploy --prod
```

👉 See [pi0/h3-on-edge](https://github.com/pi0/h3-on-edge) demo for a fully working example.
