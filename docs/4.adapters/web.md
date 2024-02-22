# Web

> Adapte your h3 docs to the native Web API, Request and Response, without any effort.

An h3 app is agnostic to the runtime environment.

In order to run h3 apps in web compatible edge runtimes supporting [`fetch` API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) with [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) and [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response), use `toWebHandler` adapter to convert h3 app into a fetch-like function.

## From h3 to Web

First, create app entry:

```js [app.mjs]
import { createApp, eventHandler } from "h3";

export const app = createApp();

app.use(eventHandler(() => "Hello world!"));
```

Create web entry:

```js [web.mjs]
import { toWebHandler } from "h3";
import { app } from "./app.mjs";

// Create Web Adapter
export const handler = toWebHandler(app);

// Integrate handler with your runtime.
// Input is a Request and response is Promise<Response>
```

> [!NOTE]
> See [runtimes](/runtimes) to see how to integrate with your runtime.

You can test adapter using any compatible JavaScript runtime by passing a Request object.

```js [web.test.mjs]
import { handler } from "./web.mjs";

const response = await handler(new Request(new URL("/", "http://localhost")));

console.log(await response.text()); // Hello world!
```

Run with `node ./web.test.mjs`.

See relavant docs for known edge platforms:

- [Cloudflare Workers](/runtimes/cloudflare)
- [Deno Deploy](/runtimes/deno)
- [Lagon](/runtimes/lagon)
- [Netlify Edge](/runtimes/netlify)

## From Web to h3

You can also convert a fetch-like function into an h3 app using `fromWebHandler` adapter:

```js [app.mjs]
import { webHandler } from "web-handler"; // This package doesn't exist, it's just an example
import { createApp, fromWebHandler } from "h3";

export const app = createApp();

app.use(fromWebHandler(webHandler));
```

> [!NOTE]
> This is not a common situation.
