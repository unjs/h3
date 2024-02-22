# Cloudflare

> Run your h3 apps in Cloudflare Workers

You can directly host your h3 applications to [Cloudflare Workers](https://workers.cloudflare.com/) using [Web Adapter](/adapters/web).

## Usage

Create app entry:

```js [app.mjs]
import { createApp, defineEventHandler } from "h3";

export const app = createApp();

app.use(defineEventHandler(() => "Hello world!"));
```

Create entry for a Cloudflare Worker:

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

Then, create a simple `wrangler.toml`:

```ini [wrangler.toml]
name = "h3-app"
main = "cloudflare.mjs"
compatibility_date = "2023-08-01"
```

Finally, use `wrangler dev` to locally preview:

```bash
npx wrangler dev
```

To deploy, use `wrangler deploy`:

```bash
npx wrangler deploy
```

---

::read-more
👉 See [pi0/h3-on-edge](https://github.com/pi0/h3-on-edge) demo for a fully working example ([deployment](https://h3-on-edge.pi0.workers.dev/)).
::
