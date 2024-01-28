---
title: Other utils
description:
---

#### Sanitize

- `sanitizeStatusMessage(statusMessage)`
- `sanitizeStatusCode(statusCode, default = 200)`

#### Route

- `useBase(base, handler)`

#### Cache

- `handleCacheHeaders(event, opts)`

#### Legacy

```js
// Legacy middleware with 3rd argument are automatically promisified
app.use(
  fromNodeMiddleware((req, res, next) => {
    req.setHeader("x-foo", "bar");
    next();
  }),
);
```
