# @json-rpc-chrome-viewer/server-logger

Reports **server-side** JSON-RPC calls to the
[JSON RPC Chrome Viewer](https://github.com/lomonosv/json-rpc-chrome-viewer)
DevTools panel.

A call your server makes while rendering a page never reaches the browser, so
DevTools cannot see it. This package collects those calls and attaches them to
the response of the browser request that caused them.

Off unless `NODE_ENV` is `development` — unset, `test`, `staging` and
`production` all leave it inert. See
[the capture contract](https://github.com/lomonosv/json-rpc-chrome-viewer/blob/main/docs/server-capture.md)
for the wire format and for implementing it in another language.

## Install

```bash
npm install --save-dev @json-rpc-chrome-viewer/server-logger
```

## Next.js 16 (App Router)

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

### Pages Router

Keep the same `proxy.ts`, and wrap `getServerSideProps` once:

```ts
import { withJsonRpcLog } from '@json-rpc-chrome-viewer/server-logger/next/pages';

export const getServerSideProps = withJsonRpcLog(async (context) => {
  // your data fetching, unchanged
});
```

If your pages already go through a shared factory, wrap the function it
returns there instead and every page is covered. The same wrapper works for
`getInitialProps` and for API route handlers.

Why the extra line: the App Router reads the log id back through
`next/headers`, which throws outside an App Router render. In
`getServerSideProps` the id is on `context.req.headers` instead, and the
wrapper is what carries it to the calls made underneath. Without it the panel
still sees the page tagged, but every log drains empty.

### Next 14 and 15

Not supported from 0.2. Their middleware runs on the edge runtime, which needs a
three-file setup; use 0.1.5, whose README describes it.

### Upgrading from 0.1.x

The `./next` and `./next/middleware` entries are gone; `./next/proxy` is
unchanged. If you set up the three-file integration, delete `instrumentation.ts`,
`middleware.ts` and the `__jsonrpc-log` route folder, and use the one-file
`proxy.ts` above.

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
  isEnabled: process.env.NODE_ENV === 'development', // default
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
