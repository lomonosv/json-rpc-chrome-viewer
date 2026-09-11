# @json-rpc-chrome-viewer/server-logger

Reports **server-side** JSON-RPC calls to the
[JSON RPC Chrome Viewer](https://github.com/lomonosv/json-rpc-chrome-viewer)
DevTools panel.

A call your server makes while rendering a page never reaches the browser, so
DevTools cannot see it. This package collects those calls and attaches them to
the response of the browser request that caused them.

Development-only by default. See
[the capture contract](https://github.com/lomonosv/json-rpc-chrome-viewer/blob/main/docs/server-capture.md)
for the wire format and for implementing it in another language.

## Install

```bash
npm install --save-dev @json-rpc-chrome-viewer/server-logger
```

## Next.js (App Router)

Three short files. The request hook is **`proxy.ts` on Next 16+** and
**`middleware.ts` on Next 14 and 15**. Next 16 still runs `middleware.ts`, but
warns that the convention is deprecated. The package supports both; use
whichever your version expects.

```ts
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { instrumentFetch } = await import('@json-rpc-chrome-viewer/server-logger/next');

    instrumentFetch();
  }
}
```

```ts
// proxy.ts — Next 16+
export { proxy } from '@json-rpc-chrome-viewer/server-logger/next/proxy';
```

```ts
// middleware.ts — Next 14 and 15
export { middleware } from '@json-rpc-chrome-viewer/server-logger/next/middleware';
```

```ts
// app/%5F_jsonrpc-log/[logId]/route.ts
export { GET } from '@json-rpc-chrome-viewer/server-logger/next';
```

The proxy mints an id before the render and puts it on the request and the
response; the instrumented `fetch` records calls against it; the route hands the
log to the extension. That split exists because an App Router page **cannot** set
a response header from inside a Server Component — the id has to be attached by
something that runs earlier.

Three details in those files are load-bearing:

- **The `NEXT_RUNTIME` guard.** Next runs `register()` on the edge runtime too,
  and the logger uses Node built-ins. Without the guard every route fails to
  build with `Reading from "node:crypto" is not handled by plugins`.
- **The `%5F` in the route folder.** A folder starting with `_` is private in the
  App Router and never routed. `%5F` is an escaped underscore, so the folder
  still serves `/__jsonrpc-log/<id>`, the path the extension drains.
- **The export name matches the file.** Next looks for `proxy` in `proxy.ts` and
  `middleware` in `middleware.ts`, so `export { middleware } from '…'` inside a
  `proxy.ts` stops Next from starting.

There is no `config` to re-export. Next only reads a `matcher` declared in your
own file, and warns on every request when one is re-exported; the logger skips
static assets at runtime instead.

Already have a `proxy.ts` (or `middleware.ts`)? Run your own logic first, and
fall through to the logger for requests you do not redirect or rewrite:

```ts
import type { NextRequest } from 'next/server';
import { proxy as tagRequest } from '@json-rpc-chrome-viewer/server-logger/next/proxy';

export function proxy(request: NextRequest) {
  // your redirects and rewrites here, returning early from each

  return tagRequest(request);
}
```

### Upgrading from 0.1.x

0.1.x did not work with the App Router, for three reasons. Two were in the
instructions and are fixed above: the route folder was `app/__jsonrpc-log`, which
Next never routes; and `instrumentation.ts` had no `NEXT_RUNTIME` guard, which
breaks the build wherever the edge runtime is in use. Rename the folder to
`app/%5F_jsonrpc-log` and add the guard.

The third was in the package: Next loads a separate copy of it into each server
bundle, and 0.1.x kept its log buffer per copy, so the drain route read an empty
buffer while calls were recorded into another. **Changing the files is not
enough — upgrade the package too.**

## Any other server

The core is framework-agnostic. Wrap the request in a log scope and let the
`fetch` patch do the rest:

```ts
import { createLogId, drainLog, instrumentFetch, runWithLog, encodeInlineLog, inlineLogHeader }
  from '@json-rpc-chrome-viewer/server-logger';

instrumentFetch();

app.use((req, res, next) => {
  const logId = createLogId();

  res.on('finish', () => drainLog(logId));

  runWithLog(logId, next);
});
```

For a client the `fetch` patch cannot see — an axios instance on a custom agent,
a driver with its own transport — record it yourself:

```ts
import { recordRpcCall } from '@json-rpc-chrome-viewer/server-logger';

await recordRpcCall({
  url, rawRequest, rawResponse, status: 200, time: 42
});
```

## Configuration

```ts
import { configure } from '@json-rpc-chrome-viewer/server-logger';

configure({
  isEnabled: process.env.NODE_ENV !== 'production', // default
  maxBodyBytes: 64 * 1024,
  maxInlineBytes: 12 * 1024,
  maxCallsPerLog: 200,
  maxLogs: 100,
  logTtlMs: 60_000
});
```

## What it does not do

- **`fetch` only.** A client on `http.request` or `XMLHttpRequest` needs
  `recordRpcCall`.
- **Bodies it cannot read without consuming them are skipped.** A `ReadableStream`
  request body is left alone rather than drained to look at it.
- **`fetch.toString()` stops reporting `[native code]`** while instrumented.
- **Reading the log id marks a Next render dynamic**, which is harmless in
  development and is one reason production is opt-in.
