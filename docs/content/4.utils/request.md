---
title: Request
description:
---

- `getQuery(event)`
- `getValidatedQuery(event, validate)`
- `getRouterParams(event, { decode? })`
- `getRouterParam(event, name, { decode? })`
- `getValidatedRouterParams(event, validate, { decode? })`
- `getMethod(event, default?)`
- `isMethod(event, expected, allowHead?)`
- `assertMethod(event, expected, allowHead?)`
- `getRequestHeaders(event, headers)` (alias: `getHeaders`)
- `getRequestHeader(event, name)` (alias: `getHeader`)
- `getRequestURL(event)`
- `getRequestHost(event)`
- `getRequestProtocol(event)`
- `getRequestPath(event)`
- `getRequestIP(event, { xForwardedFor: boolean })`
