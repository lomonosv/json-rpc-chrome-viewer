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

Three one-line files.

```ts
// instrumentation.ts
export async function register() {
  const { instrumentFetch } = await import('@json-rpc-chrome-viewer/server-logger/next');

  instrumentFetch();
}
```

```ts
// middleware.ts
export { middleware, config } from '@json-rpc-chrome-viewer/server-logger/next/middleware';
```

```ts
// app/__jsonrpc-log/[logId]/route.ts
export { GET } from '@json-rpc-chrome-viewer/server-logger/next';
```

The middleware mints an id before the render and puts it on the request and the
response; the instrumented `fetch` records calls against it; the route hands the
log to the extension. That split exists because an App Router page **cannot** set
a response header from inside a Server Component — the id has to be attached by
something that runs earlier.

Already have a `middleware.ts`? Compose it instead:

```ts
import { middleware as logger } from '@json-rpc-chrome-viewer/server-logger/next/middleware';
```

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
