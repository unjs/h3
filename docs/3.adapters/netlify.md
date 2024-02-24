---
icon: teenyicons:netlify-outline
---

# Netlify

> Run your h3 apps in Netlify Edge

You can directly host your h3 applications to [Netlify Edge](https://www.netlify.com/platform/core/edge/) using [Web Adapter](/adapters/web).

## Usage

Create app entry:

```js [app.mjs]
import { createApp, defineEventHandler } from "h3";

export const app = createApp();

app.use(defineEventHandler(() => "Hello world!"));
```

Create entry for netlify-edge:

```js [netlify/index.mjs]
import { toWebHandler } from "h3";
import { app } from "./app.mjs";

export const handler = toWebHandler(app);
```

Then, create `import_map.json`:

```json [import_map.json]
{
  "imports": {
    "h3": "https://esm.sh/h3@latest"
  }
}
```

Create `netlify.toml`:

```ini [netlify.toml]
[build]
  edge_functions = "netlify"

[functions]
  deno_import_map = "./import_map.json"
```

Finally, use `netlify dev` to locally preview:

```bash [terminal]
npx netlify dev
```

To deploy, use `netlify deploy`:

```bash [terminal]
npx netlify deploy --prod
```

---

::read-more
See [pi0/h3-on-edge](https://github.com/pi0/h3-on-edge) demo for a fully working example.
::
