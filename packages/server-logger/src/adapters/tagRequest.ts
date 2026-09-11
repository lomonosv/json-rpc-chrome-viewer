// With the extension: `next` ships no exports map, so bare Node ESM cannot
// resolve the extensionless `next/server`. Bundlers load the same file either
// way — Next aliases only `next/dist/*` for the edge build, never this.
import { NextResponse } from 'next/server.js';
import type { NextRequest } from 'next/server.js';
import { deferredLogHeader, drainPath, logIdRequestHeader } from '../core/types.js';

/*
 * Shared by both Next entries, so it must stay edge-safe: it imports nothing
 * from `core` beyond the plain constants above, because the `middleware.ts`
 * entry can land on the edge runtime, where `node:async_hooks`, `node:zlib` and
 * `node:crypto` do not exist. Pulling one in breaks the host's whole
 * middleware, not just this feature.
 */

/**
 * Next reads `config.matcher` only from an `export const config` in the host's
 * own file, so a matcher re-exported from this package never applies — Next 16
 * says so on every request and falls back to matching everything. The
 * exclusions are therefore applied here at runtime. Without them every static
 * chunk would carry an id, and the panel would drain an empty log for each.
 * Keep this in step with `config` in `nextMiddleware.ts` by hand.
 */
export const isUntaggedPath = (pathname: string): boolean => (
  pathname.startsWith(drainPath)
  || pathname.startsWith('/_next/static')
  || pathname.startsWith('/_next/image')
  || pathname === '/favicon.ico'
);

/**
 * Mints the id before the render starts: an App Router page cannot set a
 * response header from inside a Server Component, so the id has to be attached
 * by something that runs earlier. It goes on the request (where the render
 * reads it) and on the response (where the extension reads it).
 */
export const tagRequest = (request: NextRequest) => {
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
