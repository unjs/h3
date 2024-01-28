---
title: Response
description:
---

- `send(event, data, type?)`
- `sendNoContent(event, code = 204)`
- `setResponseStatus(event, status)`
- `getResponseStatus(event)`
- `getResponseStatusText(event)`
- `getResponseHeaders(event)`
- `getResponseHeader(event, name)`
- `setResponseHeaders(event, headers)` (alias: `setHeaders`)
- `setResponseHeader(event, name, value)` (alias: `setHeader`)
- `appendResponseHeaders(event, headers)` (alias: `appendHeaders`)
- `appendResponseHeader(event, name, value)` (alias: `appendHeader`)
- `defaultContentType(event, type)`
- `sendRedirect(event, location, code=302)`
- `isStream(data)`
- `sendStream(event, data)`
- `writeEarlyHints(event, links, callback)`
