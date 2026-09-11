import type { NextFetchEvent, NextMiddleware, NextRequest } from 'next/server.js';
import { isEnabled } from '../core/options.js';
import { deferredLogHeader, drainPath, logIdRequestHeader } from '../core/types.js';
import { GET, instrumentFetch } from './next.js';
import { isUntaggedPath, tagRequest } from './tagRequest.js';

type ProxyResult = Awaited<ReturnType<NextMiddleware>>;

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

/**
 * Patches `fetch` on the first request rather than at import, so importing this
 * module — from a build step, a test, a type check — changes nothing about the
 * process. It can replace `instrumentation.ts` at all only because Next 16 runs
 * `proxy.ts` on Node.js, in the same process as the render.
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

const getDrainLogId = (pathname: string): string | null => (
  pathname.startsWith(drainPrefix) ? pathname.slice(drainPrefix.length) : null
);

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

  instrumentFetch();

  const logId = getDrainLogId(request.nextUrl.pathname);

  if (logId !== null) return GET(request, { params: Promise.resolve({ logId }) });

  const response = (await handler(request, event as NextFetchEvent)) as Response | null | undefined;

  return response ? tagResponse(request, response) : tagRequest(request);
};

/**
 * The whole integration for Next 16: re-exported from a `proxy.ts`, it patches
 * `fetch`, tags every render and serves the drain — replacing
 * `instrumentation.ts` and the route file. It is the wrapper around a host
 * handler that does nothing, so there is one code path to keep correct.
 */
export const proxy = withJsonRpcLogger(() => undefined);
