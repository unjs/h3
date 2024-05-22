# From Express.js to h3

> Through various examples, let's see how easy it is to use h3 if you are familiar with Express.js.

During this guide, we will reproduce many examples from the [Express.js documentation](https://expressjs.com/en/starter/examples.html) to show you how to do the same thing with h3.

> [!NOTE]
> If you are not familiar with Express.js, you can safely skip this guide.

The idea is to show you how similar h3 is to Express.js. Once you understand the similarities, you will be able to use h3 without any problem if you are familiar with Express.js.

> [!CAUTION]
> Even if h3 seems to be similar to Express.js, it does not mean that Express.js is still viable. Express.js is an old framework that has not evolved for a long time. It's not a good choice for new projects since it can easily lead to security issues and memory leaks.

With h3, you also have reloading out-of-the-box without any configuration using [unjs/listhen](https://https://github.com/unjs/listhen?tab=readme-ov-file#readme).

> [!NOTE]
> You can run every h3 examples using `npx --yes listhen -w ./app.ts`.

## Hello World

The first example from the Express.js documentation is the [Hello World](https://github.com/expressjs/express/blob/master/examples/hello-world/index.js).

The code is pretty simple:

```js [index.js]
/**
 * Express.js example app.
 */
var express = require("express");
var app = express();

app.get("/", function (req, res) {
  res.send("Hello World");
});

app.listen(3000);
console.log("Express started on port 3000");
```

Let's see how to do the same thing with h3:

```ts [app.ts]
/**
 * h3 example app.
 */
import { createApp, defineEventHandler } from "h3";

export const app = createApp();

app.use(
  "/",
  defineEventHandler((event) => {
    return "Hello World";
  }),
);
```

Then, you can use `npx --yes listhen -w ./app.ts` to start the server and go to http://localhost:3000 to see the result.

:read-more{to="/guide/app"}

## Multi Router

The second example is the [Multi Router](https://github.com/expressjs/express/blob/master/examples/multi-router/index.js). In this example, we create many routers to split the logic.

```js [index.js]
/**
 * Express.js example app.
 */
var express = require("express");

var app = express();

var apiv1 = express.Router();

apiv1.get("/", function (req, res) {
  res.send("Hello from APIv1 root route.");
});

apiv1.get("/users", function (req, res) {
  res.send("List of APIv1 users.");
});

var apiv2 = express.Router();

apiv2.get("/", function (req, res) {
  res.send("Hello from APIv2 root route.");
});

apiv2.get("/users", function (req, res) {
  res.send("List of APIv2 users.");
});

app.use("/api/v1", apiv1);
app.use("/api/v2", apiv2);

app.get("/", function (req, res) {
  res.send("Hello from root route.");
});

app.listen(3000);
console.log("Express started on port 3000");
```

> [!NOTE]
> For some facilities, we group every files in the same one.

Using h3, we can do the same thing:

```ts [app.ts]
/**
 * h3 example app.
 */
import { createApp, createRouter, defineEventHandler, useBase } from "h3";

export const app = createApp();

const apiv1 = createRouter()
  .get(
    "/",
    defineEventHandler(() => {
      return "Hello from APIv1 root route.";
    }),
  )
  .get(
    "/users",
    defineEventHandler(() => {
      return "List of APIv1 users.";
    }),
  );

const apiv2 = createRouter()
  .get(
    "/",
    defineEventHandler(() => {
      return "Hello from APIv2 root route.";
    }),
  )
  .get(
    "/users",
    defineEventHandler(() => {
      return "List of APIv2 users.";
    }),
  );

app.use("/api/v1/**", useBase("/api/v1", apiv1.handler));
app.use("/api/v2/**", useBase("/api/v2", apiv2.handler));
```

It's quite similar. The main difference is that we have to use `useBase` to define a base path for a router.

:read-more{to="/guide/router"}

## Params

The third example is the [Params](https://github.com/expressjs/express/tree/master/examples/params/index.js). In this example, we use parameters in the route.

```js [index.js]
/**
 * Express.js example app.
 */
var createError = require("http-errors");
var express = require("express");
var app = express();

var users = [
  { name: "tj" },
  { name: "tobi" },
  { name: "loki" },
  { name: "jane" },
  { name: "bandit" },
];

app.param(["to", "from"], function (req, res, next, num, name) {
  req.params[name] = parseInt(num, 10);
  if (isNaN(req.params[name])) {
    next(createError(400, "failed to parseInt " + num));
  } else {
    next();
  }
});

app.param("user", function (req, res, next, id) {
  if ((req.user = users[id])) {
    next();
  } else {
    next(createError(404, "failed to find user"));
  }
});

app.get("/", function (req, res) {
  res.send("Visit /user/0 or /users/0-2");
});

app.get("/user/:user", function (req, res) {
  res.send("user " + req.user.name);
});

app.get("/users/:from-:to", function (req, res) {
  var from = req.params.from;
  var to = req.params.to;
  var names = users.map(function (user) {
    return user.name;
  });
  res.send("users " + names.slice(from, to + 1).join(", "));
});

app.listen(3000);
console.log("Express started on port 3000");
```

Using h3, we can do the same thing:

```ts [app.ts]
/**
 * h3 example app.
 */
import {
  createApp,
  createError,
  createRouter,
  defineEventHandler,
  getRouterParam,
  getValidatedRouterParams,
} from "h3";
import { z } from "zod";

const users = [
  { name: "tj" },
  { name: "tobi" },
  { name: "loki" },
  { name: "jane" },
  { name: "bandit" },
];

export const app = createApp();
const router = createRouter();

router.get(
  "/",
  defineEventHandler(() => {
    return "Visit /users/0 or /users/0/2";
  }),
);

router.get(
  "/user/:user",
  defineEventHandler(async (event) => {
    const { user } = await getValidatedRouterParams(
      event,
      z.object({
        user: z.number({ coerce: true }),
      }).parse,
    );

    if (!users[user])
      throw createError({
        status: 404,
        statusMessage: "User Not Found",
      });

    return `user ${user}`;
  }),
);

router.get(
  "/users/:from/:to",
  defineEventHandler(async (event) => {
    const { from, to } = await getValidatedRouterParams(
      event,
      z.object({
        from: z.number({ coerce: true }),
        to: z.number({ coerce: true }),
      }).parse,
    );

    const names = users.map((user) => {
      return user.name;
    });

    return `users ${names.slice(from, to).join(", ")}`;
  }),
);

app.use(router);
```

With h3, we do not have a `param` method. Instead, we use `getRouterParam` or `getValidatedRouterParams` to validate the params. It's more explicit and easier to use. In this example, we use `Zod` but you are free to use any other validation library.

## Cookies

The fourth example is the [Cookies](https://github.com/expressjs/express/blob/master/examples/cookies/index.js). In this example, we use cookies.

```js [index.js]
/**
 * Express.js example app.
 */
var express = require("express");
var app = express();
var cookieParser = require("cookie-parser");

app.use(cookieParser("my secret here"));

app.use(express.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  if (req.cookies.remember) {
    res.send('Remembered :). Click to <a href="/forget">forget</a>!.');
  } else {
    res.send(
      '<form method="post"><p>Check to <label>' +
        '<input type="checkbox" name="remember"/> remember me</label> ' +
        '<input type="submit" value="Submit"/>.</p></form>',
    );
  }
});

app.get("/forget", function (req, res) {
  res.clearCookie("remember");
  res.redirect("back");
});

app.post("/", function (req, res) {
  var minute = 60000;
  if (req.body.remember) res.cookie("remember", 1, { maxAge: minute });
  res.redirect("back");
});

app.listen(3000);
console.log("Express started on port 3000");
```

Using h3, we can do the same thing:

```ts [app.ts]
import {
  createApp,
  createRouter,
  defineEventHandler,
  getCookie,
  getHeader,
  readBody,
  sendRedirect,
  setCookie,
} from "h3";

export const app = createApp();
const router = createRouter();

router.get(
  "/",
  defineEventHandler((event) => {
    const remember = getCookie(event, "remember");

    if (remember) {
      return 'Remembered :). Click to <a href="/forget">forget</a>!.';
    } else {
      return `<form method="post"><p>Check to <label>
    <input type="checkbox" name="remember"/> remember me</label>
    <input type="submit" value="Submit"/>.</p></form>`;
    }
  }),
);

router.get(
  "/forget",
  defineEventHandler((event) => {
    deleteCookie(event, "remember");

    const back = getHeader(event, "referer") || "/";
    return sendRedirect(event, back);
  }),
);

router.post(
  "/",
  defineEventHandler(async (event) => {
    const body = await readBody(event);

    if (body.remember)
      setCookie(event, "remember", "1", { maxAge: 60 * 60 * 24 * 7 });

    const back = getHeader(event, "referer") || "/";
    return sendRedirect(event, back);
  }),
);

app.use(router);
```

With h3, we do not have a `cookieParser` middleware. Instead, we use `getCookie` and `setCookie` to get and set cookies. It's more explicit and easier to use.

## Middleware

When using `express`, we usually handle requests with `middleware`.

For instance, here we use `morgan` to handle request logging.

```js [index.js]
var express = require("express");
var morgan = require("morgan");

var app = express();

app.use(morgan("combined"));

app.get("/", function (req, res) {
  res.send("hello, world!");
});

app.listen(3000);
console.log("Express started on port 3000");
```

In `h3`, we can also directly use middleware from the `express` ecosystem.

This can be easily achieved by wrapping with `fromNodeMiddleware`.

```ts [app.ts]
import morgan from "morgan";
import { defineEventHandler, createApp, fromNodeMiddleware } from "h3";

export const app = createApp();

app.use(fromNodeMiddleware(morgan()));

app.use(
  "/",
  defineEventHandler((event) => {
    return "Hello World";
  }),
);
```
