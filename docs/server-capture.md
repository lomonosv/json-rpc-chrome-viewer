# Server-side capture contract

The panel can only see traffic the browser makes. A JSON-RPC call your server
makes while rendering a page never crosses that boundary, so the server has to
hand it over. This document is the contract it hands it over with.

It is a **public compatibility surface**. Any server in any language can
implement it; `@json-rpc-chrome-viewer/server-logger` is one implementation, not
the definition. Every payload carries `v`, and either side ignores a version it
does not understand rather than half-parsing it.

## Wire format

```ts
interface IServerRpcCall {
  callId: string,        // minted once, at the point of the call
  url: string,           // the endpoint the server called
  startTime: number,     // epoch ms, server clock
  time: number,          // duration in ms
  status: number,        // 0 when the call threw before a response arrived
  rawRequest: string,    // request body verbatim, or with oversized members replaced
  rawResponse: string,   // response body verbatim, or with oversized members replaced
  isTruncated?: boolean,
}

interface IServerRpcLog {
  v: 1,
  logId: string,
  calls: IServerRpcCall[],
}
```

`rawRequest` / `rawResponse` are handed to the panel's existing
`getPreparedJsonRpcRequests()`, so batches explode into one row per item and
responses correlate by `id` exactly as they do for browser traffic. Nothing in
this format restates what the bodies already say.

**Truncation replaces members, it does not cut strings.** A body over the cap has
its `params` / `result` / `error` swapped for `"[truncated N bytes]"` and is
re-serialised, so what arrives is still parseable JSON-RPC. A cut string would
reach the panel as an unparseable body — a warning row with no method, which is
strictly less useful than a row that says its params were dropped.

## Delivery modes

Both attach to the response of the browser request that *caused* the calls,
which is what lets the panel nest server calls under the request they belong to.

### Inline — `X-Json-Rpc-Log`

Base64 of gzip of the JSON envelope, on the response. One round trip, no
endpoint. Use it wherever you control the response at the end of the request:
Express, Fastify, `node:http`, Next.js Route Handlers.

Bounded by header size — Node caps outgoing headers around 16KB and proxies are
often stricter. An emitter that would exceed its cap emits **nothing** rather
than a header that gets rejected downstream; that is what the deferred mode is
for.

### Deferred — `X-Json-Rpc-Log-Id` + drain endpoint

The response carries only an id; the payload is pulled afterwards from
`GET /__jsonrpc-log/<logId>`.

This is the mode that makes **Next.js App Router pages work at all**. RSC calls
happen *during* the response, and a Server Component cannot set a response
header — so the id is minted by `proxy.ts` (`middleware.ts` before Next 16), which runs before the render,
and placed on both the request (where the render reads it) and the response
(where the extension reads it).

No size ceiling, nothing for a proxy to strip. Costs one endpoint and one extra
request.

**Draining consumes.** A second read of the same id returns an empty log, so one
render's calls can never be served onto another.

## Panel side

The document response's headers arrive free with every request in
`chrome.devtools.network.onRequestFinished`, which reports only the inspected
tab — so no tab scoping is needed on this path, unlike the relayed ones.

DevTools reads raw response headers rather than the CORS-filtered set JS sees,
so neither header needs `Access-Control-Expose-Headers`, and both work against a
BFF on a different origin.

**The panel drains the deferred log itself** (`src/logic/HTTPArchive/serverLog.ts`).
A devtools panel is an extension page, and extension pages with host permissions
are exempt from CORS — so the drain endpoint needs no `Access-Control-*` headers,
and no hop through the service worker or the broadcast relay is needed. The
panel's own fetch is not a request in the inspected tab, so it never reappears
in the list. It is sent with `credentials: 'omit'` and a 5s timeout, only to an
`http(s)` origin — the one that emitted the id — and the id is checked against
`/^[A-Za-z0-9-]{1,128}$/` before it reaches a URL, since the header is
controlled by the page's server.

**A response without either header costs one header scan and nothing more** —
no fetch, no parse, no row. That is the compatibility guarantee: with no emitter
installed, the panel behaves exactly as it did before this contract existed.

**A deferred log opened late is gone.** An undrained log lives for the emitter's
TTL (60s by default). The panel buffers the page load before it is first shown,
but if it is opened after the TTL the drain returns an empty log. Inline mode
has no such limit, because the payload travels with the response.

## Safety rules for any implementation

These are not suggestions — an emitter that breaks one of them ships request and
response bodies to people who should not have them.

- **Development only by default.** This exposes internal endpoints and payloads
  to anything that can read the response. Production is an explicit opt-in.
- **Bind the drain endpoint to loopback** and return 404 when disabled.
- **Cap everything**: per body, per log, and per ring buffer. An undrained log
  has a TTL; a server that stops being scraped must not grow without bound.
- **Never break the request you are observing.** Detection must not consume a
  stream body, a failed read must still report the call, and a rejection must
  propagate unchanged.
