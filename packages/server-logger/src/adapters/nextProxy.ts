// With the extension: `next` ships no exports map, so bare Node ESM cannot
// resolve the extensionless `next/server`. Bundlers load the same file either
// way — Next aliases only `next/dist/*` for the edge build, never this.
import { NextResponse } from 'next/server.js';
import type { NextFetchEvent, NextMiddleware, NextRequest } from 'next/server.js';
import { drainLog, setLogIdResolver } from '../core/collector.js';
import { isEnabled } from '../core/options.js';
import { deferredLogHeader, drainPath, logIdRequestHeader } from '../core/types.js';
import { instrumentFetch } from '../instrument/fetch.js';

type ProxyResult = Awaited<ReturnType<NextMiddleware>>;

interface IHeaderStore {
  get(name: string): string | null,
}

type HeadersFn = () => Promise<IHeaderStore>;

/**
 * Next's own protocol for handing request headers from a proxy to the render,
 * as `NextResponse.next({ request: { headers } })` writes it
 * (`handleMiddlewareField` in `next/dist/server/web/spec-extension/response.js`).
 */
const continueHeader = 'x-middleware-next';
const rewriteHeader = 'x-middleware-rewrite';
const overrideListHeader = 'x-middleware-override-headers';
const requestHeaderPrefix = 'x-middleware-request-';

const drainPrefix = `${ drainPath }/`;

let headersFn: HeadersFn | null = null;

/**
 * `next/headers` is imported lazily and cached: importing it at module scope
 * would make this entry unusable outside a Next app, and re-importing per call
 * would put a module resolution on the path of every JSON-RPC request.
 */
const getHeadersFn = async (): Promise<HeadersFn> => {
  if (!headersFn) {
    const mod = await import('next/headers.js');

    headersFn = mod.headers as unknown as HeadersFn;
  }

  return headersFn;
};

/**
 * Finds the current render's log id on its request headers, where `tagResponse`
 * put it. Reading `headers()` marks a render dynamic, which is harmless because
 * the logger is development-only by default — and one reason enabling it in
 * production is a deliberate opt-in.
 */
const resolveLogIdFromHeaders = async (): Promise<string | undefined> => {
  const headers = await getHeadersFn();
  const store = await headers();

  return store.get(logIdRequestHeader) || undefined;
};

/**
 * Patches `fetch` on the first request rather than at import, so importing this
 * module — from a build step, a test, a type check — changes nothing about the
 * process. That works only because Next 16 runs `proxy.ts` on Node.js, in the
 * same process as the render.
 *
 * **It runs on every request, and a one-shot guard here would be a bug.**
 * `next dev` restores the pristine `fetch` on every recompile (`resetFetch` in
 * Next's `router-server.js`), evicting the patch while every other part of the
 * integration carries on working — so the logger would go quiet after the first
 * recompile and look disabled rather than unpatched. This is the one hook that
 * reliably runs before a render, which makes it the place the patch gets put
 * back. `instrumentFetch` answers "am I still installed" by identity and is a
 * couple of comparisons when nothing has changed.
 */
const armFetch = (): void => {
  setLogIdResolver(resolveLogIdFromHeaders);
  instrumentFetch();
};

/**
 * Next reads `config.matcher` only from an `export const config` in the host's
 * own file, so a matcher re-exported from this package never applies — Next 16
 * says so on every request and falls back to matching everything. The
 * exclusions are therefore applied here at runtime. Without them every static
 * chunk would carry an id, and the panel would drain an empty log for each.
 */
const isUntaggedPath = (pathname: string): boolean => (
  pathname.startsWith(drainPath)
  || pathname.startsWith('/_next/static')
  || pathname.startsWith('/_next/image')
  || pathname === '/favicon.ico'
);

const getDrainLogId = (pathname: string): string | null => (
  pathname.startsWith(drainPrefix) ? pathname.slice(drainPrefix.length) : null
);

/**
 * Answers `/__jsonrpc-log/<id>`. Draining consumes the log, so a second read of
 * the same id returns nothing rather than replaying one render's calls onto
 * another.
 */
const drain = (logId: string): Response => (
  new Response(JSON.stringify(drainLog(logId)), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store'
    }
  })
);

/**
 * Mints the id before the render starts: an App Router page cannot set a
 * response header from inside a Server Component, so the id has to be attached
 * by something that runs earlier. It goes on the request (where the render
 * reads it) and on the response (where the extension reads it).
 */
const tagRequest = (request: NextRequest): Response => {
  if (isUntaggedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const logId = crypto.randomUUID();
  const headers = new Headers(request.headers);

  headers.set(logIdRequestHeader, logId);

  const response = NextResponse.next({ request: { headers } });

  response.headers.set(deferredLogHeader, logId);

  return response;
};

/**
 * Adds the id to a response the host's handler produced, keeping everything the
 * host put on it. Only a continue or a rewrite renders a page; a redirect, or a
 * response the host built itself, is returned untouched.
 *
 * The override list is authoritative: before the render, Next deletes every
 * request header it does not name (`resolve-routes.js`), which is why
 * `NextResponse.next({ request: { headers } })` always writes the complete set.
 * One header is therefore added in one of two ways:
 * - the host already overrode request headers: append ours to its list, as
 *   Next's own `adapter.js` does;
 * - it did not: supply the full set, exactly as `NextResponse.next` would.
 *   A list naming only our header would strip `cookie` and `authorization`
 *   from the render and break the host's auth, not just the logger.
 *
 * Never throws. A continue response whose headers cannot be written is returned
 * as it came, untagged, because a logger must not break the host's proxy.
 */
const tagResponse = (request: NextRequest, response: Response): Response => {
  const { headers } = response;
  const isRender = headers.has(continueHeader) || headers.has(rewriteHeader);

  if (!isRender || isUntaggedPath(request.nextUrl.pathname)) return response;

  try {
    const logId = crypto.randomUUID();
    const overrides = headers.get(overrideListHeader);

    if (overrides === null) {
      const requestHeaders = new Headers(request.headers);
      const keys: string[] = [];

      requestHeaders.set(logIdRequestHeader, logId);
      requestHeaders.forEach((value, key) => {
        headers.set(`${ requestHeaderPrefix }${ key }`, value);
        keys.push(key);
      });
      headers.set(overrideListHeader, keys.join(','));
    } else {
      const keys = overrides ? overrides.split(',') : [];

      headers.set(`${ requestHeaderPrefix }${ logIdRequestHeader }`, logId);

      if (!keys.includes(logIdRequestHeader)) {
        headers.set(overrideListHeader, [...keys, logIdRequestHeader].join(','));
      }
    }

    headers.set(deferredLogHeader, logId);
  } catch (e) {
    // Deliberately swallowed; see above.
  }

  return response;
};

/**
 * Wraps a host's existing proxy. The extension's log requests are answered
 * before the host's code runs, not after: the panel sends them without cookies,
 * so an auth check in the host's proxy would otherwise redirect every one.
 * Everything else reaches the host's handler, and a render it lets through is
 * tagged (see `tagResponse`). Returning nothing means "continue", as it does to
 * Next itself.
 */
export const withJsonRpcLogger = (handler: NextMiddleware) => async (
  request: NextRequest,
  event?: NextFetchEvent
): Promise<ProxyResult> => {
  if (!isEnabled()) return handler(request, event as NextFetchEvent);

  armFetch();

  const logId = getDrainLogId(request.nextUrl.pathname);

  if (logId !== null) return drain(logId);

  const response = (await handler(request, event as NextFetchEvent)) as Response | null | undefined;

  return response ? tagResponse(request, response) : tagRequest(request);
};

/**
 * The whole integration: re-exported from a `proxy.ts`, it patches `fetch`, tags
 * every render and serves the drain. It is the wrapper around a host handler
 * that does nothing, so there is one code path to keep correct.
 */
export const proxy = withJsonRpcLogger(() => undefined);
