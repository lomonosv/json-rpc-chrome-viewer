import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { deferredLogHeader, drainPath, logIdRequestHeader } from '../core/types.js';

/**
 * Runs on the edge runtime, so it must import nothing from `core` beyond the
 * plain constants above — `node:async_hooks`, `node:zlib` and `node:crypto` are
 * all unavailable here, and pulling one in breaks the whole middleware, not
 * just this feature.
 *
 * Its only job is to mint the id before the render starts: an App Router page
 * cannot set a response header from inside a Server Component, so the id has to
 * be attached by something that runs earlier. It goes on the request (where the
 * render reads it) and on the response (where the extension reads it).
 */
export const middleware = (request: NextRequest) => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith(drainPath)) {
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
 * Static assets and image optimisation never make JSON-RPC calls, and tagging
 * them would churn the ring buffer with empty logs.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
