import { NextResponse } from 'next/server.js';
import type { NextRequest } from 'next/server.js';
import { tagRequest } from './tagRequest.js';

/**
 * The `middleware.ts` entry: Next 14-15, and still run by 16 with a deprecation
 * warning. Middleware runs on the edge runtime by default, which can neither
 * patch Node's `fetch` nor read the collector's buffer, so this entry only mints
 * the id — the host still needs `instrumentation.ts` and the drain route. On
 * Next 16, `./next/proxy` does all three from one file.
 *
 * Production is gated on `NODE_ENV` rather than `isEnabled()`, because options
 * live in the Node process, which an edge function cannot see.
 */
export const middleware = (request: NextRequest) => (
  process.env.NODE_ENV === 'production' ? NextResponse.next() : tagRequest(request)
);

/**
 * Kept only so `middleware.ts` files written against 0.1.x, which re-exported
 * it, keep resolving. Re-exporting it achieves nothing: Next 16 logs "can't
 * recognize the exported `config` field ... it may be re-exported from another
 * file" on every request and uses its default, and `isUntaggedPath` does the
 * real work. Matcher-only: a `runtime` key would make Next reject it inside a
 * `proxy.ts`.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
