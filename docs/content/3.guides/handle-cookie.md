---
title: Handle Cookie
description: Use cookies to store data on the client.
---

Handling cookies with H3 is straightforward. There is three utilities to handle cookies:

- [`setCookie`](/concepts/utilities) to attach a cookie to the response.
- [`getCookie`](/concepts/utilities) to get a cookie from the request.
- [`deleteCookie`](/concepts/utilities) to clear a cookie from the response.

## Set a Cookie

To set a cookie, you need to use [`setCookie`](/concepts/utilities) in an [event handler](/concepts/event-handler):

```ts
import { defineEventHandler, setCookie } from "h3";

app.use(
  defineEventHandler(async (event) => {
    setCookie(event, "name", "value", { maxAge: 60 * 60 * 24 * 7 });

    return;
  }),
);
```

In the options, you can configure the [cookie flags](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie):

- `maxAge` to set the expiration date of the cookie in seconds.
- `expires` to set the expiration date of the cookie in a `Date` object.
- `path` to set the path of the cookie.
- `domain` to set the domain of the cookie.
- `secure` to set the `Secure` flag of the cookie.
- `httpOnly` to set the `HttpOnly` flag of the cookie.
- `sameSite` to set the `SameSite` flag of the cookie.

:read-more{to="/concepts/utilities"}


## Get a Cookie

To get a cookie, you need to use [`getCookie`](/concepts/utilities) in an [event handler](/concepts/event-handler):

```ts
import { defineEventHandler, getCookie } from "h3";

app.use(
  defineEventHandler(async (event) => {
    const name = getCookie(event, "name");

    return;
  }),
);
```

This will return the value of the cookie if it exists, or `undefined` otherwise.

:read-more{to="/concepts/utilities"}

## Delete a Cookie

To delete a cookie, you need to use [`deleteCookie`](/concepts/utilities) in an [event handler](/concepts/event-handler):

```ts
import { defineEventHandler, deleteCookie } from "h3";

app.use(
  defineEventHandler(async (event) => {
    deleteCookie(event, "name");

    return;
  }),
);
```

The utility `deleteCookie` is a wrapper around [`setCookie`](/concepts/utilities) with the value set to `""` and the `maxAge` set to `0`.

This will erase the cookie from the client.

:read-more{to="/concepts/utilities"}
