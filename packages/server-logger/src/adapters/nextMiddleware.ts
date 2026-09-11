import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { deferredLogHeader, drainPath, logIdRequestHeader } from '../core/types.js';

/**
 * Next reads `config.matcher` only from an `export const config` in the host's
 * own file, so a matcher re-exported from this package never applies — Next 16
 * says so on every request and falls back to matching everything. The
 * exclusions are therefore applied here at runtime. Without them every static
 * chunk would carry an id, and the panel would drain an empty log for each.
 * Keep this in step with `config` below by hand.
 */
const isUntaggedPath = (pathname: string): boolean => (
  pathname.startsWith(drainPath)
  || pathname.startsWith('/_next/static')
  || pathname.startsWith('/_next/image')
  || pathname === '/favicon.ico'
);

/**
 * One handler serves both of Next's request-interception conventions:
 * `proxy.ts` (Next 16+, which always runs it on the Node.js runtime) and
 * `middleware.ts` (Next 14-15, still honoured by 16 with a deprecation warning,
 * and on the edge runtime by default). Because this module can land on the
 * edge, it must import nothing from `core` beyond the plain constants above —
 * `node:async_hooks`, `node:zlib` and `node:crypto` are unavailable there, and
 * pulling one in breaks the host's whole middleware, not just this feature.
 *
 * Its only job is to mint the id before the render starts: an App Router page
 * cannot set a response header from inside a Server Component, so the id has to
 * be attached by something that runs earlier. It goes on the request (where the
 * render reads it) and on the response (where the extension reads it).
 */
const tagRequest = (request: NextRequest) => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.next();
  }

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
 * Next resolves the handler by file name — `mod.proxy` in `proxy.ts` and
 * `mod.middleware` in `middleware.ts`, each falling back to `mod.default` — so
 * the one function is exported under both names. Re-exporting the wrong name
 * for the file makes Next refuse to start it.
 */
export const proxy = tagRequest;

export const middleware = tagRequest;

/**
 * Kept only so `middleware.ts` files written against 0.1.x, which re-exported
 * it, keep resolving. Re-exporting it achieves nothing: Next 16 logs "can't
 * recognize the exported `config` field ... it may be re-exported from another
 * file" on every request and uses its default, and `isUntaggedPath` does the
 * real work. `./next/proxy` is new, has no such callers, and does not offer it.
 * Matcher-only: a `runtime` key would make Next reject it inside `proxy.ts`.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
