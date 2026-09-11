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

### Next 16 — one file

```ts
// proxy.ts
export { proxy } from '@json-rpc-chrome-viewer/server-logger/next/proxy';
```

That is the whole integration. Next 16 runs `proxy.ts` on Node.js, in the same
process as your pages, so this one export does all three jobs: it patches the
server's `fetch`, tags every page render with a log id, and answers the
extension at `/__jsonrpc-log/<id>`.

**Already have a `proxy.ts`?** Wrap your handler instead:

```ts
// proxy.ts
import { NextResponse } from 'next/server';
import { withJsonRpcLogger } from '@json-rpc-chrome-viewer/server-logger/next/proxy';

export const proxy = withJsonRpcLogger((request) => {
  // your redirects, rewrites and auth checks, unchanged

  return NextResponse.next();
});
```

The wrapper answers the extension's log requests *before* your code runs — they
are sent without cookies, so an auth check would otherwise redirect them.
Everything else reaches your handler as before. A `next()` or `rewrite()` you
return gets the log id added, keeping your headers and cookies; redirects and
responses you build yourself pass through untouched. Returning nothing works
too, and means "continue", as it does to Next.

This relies on the proxy sharing a process with your pages, which holds for
`next dev` and `next start`.

### Next 14 and 15 — three files

Middleware runs on the edge runtime by default, which can neither patch Node's
`fetch` nor reach the logger's buffer, so two more files do those jobs:

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
// middleware.ts
export { middleware } from '@json-rpc-chrome-viewer/server-logger/next/middleware';
```

```ts
// app/%5F_jsonrpc-log/[logId]/route.ts
export { GET } from '@json-rpc-chrome-viewer/server-logger/next';
```

Three details in those files are load-bearing:

- **The `NEXT_RUNTIME` guard.** Next runs `register()` on the edge runtime too,
  and the logger uses Node built-ins. Without the guard every route fails to
  build with `Reading from "node:crypto" is not handled by plugins`.
- **The `%5F` in the route folder.** A folder starting with `_` is private in the
  App Router and never routed. `%5F` is an escaped underscore, so the folder
  still serves `/__jsonrpc-log/<id>`, the path the extension drains.
- **No `config` to re-export.** Next only reads a `matcher` declared in your own
  file, and warns on every request when one is re-exported; the logger skips
  static assets at runtime instead.

Next 16 still runs `middleware.ts`, with a deprecation warning, but there the
one-file `proxy.ts` is simpler. **Export the name that matches your file:** Next
looks for `proxy` in `proxy.ts` and `middleware` in `middleware.ts`, and the
wrong one stops Next from starting.

### Upgrading from 0.1.x

0.1.x did not work with the App Router, for three reasons. Two were in the
instructions: the route folder was `app/__jsonrpc-log`, which Next never routes;
and `instrumentation.ts` had no `NEXT_RUNTIME` guard, which breaks the build
wherever the edge runtime is in use. The third was in the package: Next loads a
separate copy of it into each server bundle, and 0.1.x kept its log buffer per
copy, so the drain route read an empty buffer while calls were recorded into
another. **Upgrade the package**, then:

- **On Next 16**, replace all three files with the one-file `proxy.ts` above.
- **On Next 14 and 15**, rename the folder to `app/%5F_jsonrpc-log` and add the
  guard to `instrumentation.ts`.

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
