# Serve Static Assets

> Serve static assets such as HTML, images, CSS, JavaScript, etc.

h3 can serve static assets such as HTML, images, CSS, JavaScript, etc.

> [!NOTE]
> If you use [`unjs/listhen`](https://listhen.unjs.io), you've just to create a `public` directory in your project root and put your static assets in it. They will be served automatically.

## Usage

To serve a static directory, you can use the `serveStatic` utility.

```ts
import { createApp, serveStatic } from "h3";

export const app = createApp();

app.use((event) => {
  return serveStatic(event, {
    getContents: (id) => {
      return undefined;
    },
    getMeta: (id) => {
      return undefined;
    },
  });
});
```

This does not serve any files yet. You need to implement the `getContents` and `getMeta` methods.

- `getContents` is used to read the contents of a file. It should return a `Promise` that resolves to the contents of the file or `undefined` if the file does not exist.
- `getMeta` is used to get the metadata of a file. It should return a `Promise` that resolves to the metadata of the file or `undefined` if the file does not exist.

They are separated to allow h3 to respond to `HEAD` requests without reading the contents of the file and to use the `Last-Modified` header.

## Read Files

Now, create a `index.html` file in the `public` directory with a simple message and open your browser to http://localhost:3000. You should see the message.

> [!NOTE]
> Usage of `public` is a convention but you can use any directory name you want.

> [!NOTE]
> If you're are using [`unjs/listhen`](https://listhen.unjs.io) and want to try this example, create a directory with another name than `public` because it's the default directory used by `listhen`.

Then, we can create the `getContents` and `getMeta` methods:

```ts
import { createApp, serveStatic } from "h3";
import { stat, readFile } from "node:fs/promises";
import { join } from "pathe";

export const app = createApp();

const publicDir = "assets";

app.use((event) => {
  return serveStatic(event, {
    getContents: (id) => readFile(join(publicDir, id)),
    getMeta: async (id) => {
      const stats = await stat(join(publicDir, id)).catch(() => {});

      if (!stats || !stats.isFile()) {
        return;
      }

      return {
        size: stats.size,
        mtime: stats.mtimeMs,
      };
    },
  });
});
```

The `getContents` read the file and returns its contents, pretty simple. The `getMeta` uses `fs.stat` to get the file metadata. If the file does not exist or is not a file, it returns `undefined`. Otherwise, it returns the file size and the last modification time.

The file size and last modification time are used to create an etag to send a `304 Not Modified` response if the file has not been modified since the last request. This is useful to avoid sending the same file multiple times if it has not changed.

## Resolving Assets

If the path does not match a file, h3 will try to add `index.html` to the path and try again. If it still does not match, it will return a 404 error.

You can change this behavior by passing a `indexNames` option to `serveStatic`:

```ts
import { createApp, serveStatic } from "h3";

const app = createApp();

app.use(
  serveStatic({
    indexNames: ["/app.html", "/index.html"],
  }),
);
```

With this option, h3 will try to match `<path>/app.html` first, then `<path>/index.html` and finally return a 404 error.

> [!IMPORTANT]
> Do not forget `/` at the beginning of the h3 concatenates the path with the index name. For example, `/index.html` will be concatenated with `/hello` to form `hello/index.html`.
