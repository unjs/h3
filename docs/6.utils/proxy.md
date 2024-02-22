# Proxy

- `sendProxy(event, { target, ...options })`
- `proxyRequest(event, { target, ...options })`
- `fetchWithEvent(event, req, init, { fetch? }?)`
- `getProxyRequestHeaders(event)`

```js
app.use(
  "/api",
  eventHandler((event) =>
    proxyRequest(event, "https://example.com", {
      // f.e. keep one domain unchanged, rewrite one domain and remove other domains
      cookieDomainRewrite: {
        "example.com": "example.com",
        "example.com": "somecompany.co.uk",
        "*": "",
      },
      cookiePathRewrite: {
        "/": "/api",
      },
    }),
  ),
);
```
