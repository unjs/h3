---
title: Cloudflare
description:
---

You can directly host your H3 applications to [Cloudflare Workers](https://workers.cloudflare.com/) using [Web Adapter](/runtimes/web).

Create app entry:

```js [app.mjs]
import { createApp, eventHandler } from "h3";

export const app = createApp();

app.use(eventHandler(() => "Hello world!"));
```

Create entry for cloudflare worker:

```js [cloudflare.mjs]
import { toWebHandler } from "h3";
import { app } from "./app.mjs";

const handler = toWebHandler(app);

export default {
  async fetch(request, env, ctx) {
    return handler(request, {
      cloudflare: { env, ctx },
    });
  },
};
```

Create a simple `wrangler.toml`:

```toml [wrangler.toml]
name = "h3-app"
main = "cloudflare.mjs"
compatibility_date = "2023-08-01"
```

Use `wrangler dev` to locally preview:

```bash [terminal]
npx wrangler dev
```

Use `wrangler deploy` to deploy:

```bash [terminal]
npx wrangler deploy
```

👉 See [pi0/h3-on-edge](https://github.com/pi0/h3-on-edge) demo for a fully working example ([deployment](https://h3-on-edge.pi0.workers.dev/)).
