import { drainLog, setLogIdResolver } from '../core/collector.js';
import { isEnabled } from '../core/options.js';
import { logIdRequestHeader } from '../core/types.js';
import { instrumentFetch as instrumentGlobalFetch } from '../instrument/fetch.js';

interface IHeaderStore {
  get(name: string): string | null,
}

type HeadersFn = () => IHeaderStore | Promise<IHeaderStore>;

let headersFn: HeadersFn | null = null;

/**
 * `next/headers` is imported lazily and cached: importing it at module scope
 * would make this entry unusable outside a Next app, and re-importing per call
 * would put a module resolution on the path of every JSON-RPC request. The
 * `.js` extension is required for the same reason as in `tagRequest.ts`.
 */
const getHeadersFn = async (): Promise<HeadersFn> => {
  if (!headersFn) {
    const mod = await import('next/headers.js');

    headersFn = mod.headers as unknown as HeadersFn;
  }

  return headersFn;
};

/**
 * Call from `instrumentation.ts`'s `register()`. It patches the global fetch and
 * teaches the collector to find the current log id on the incoming request
 * headers, which is where the middleware put it.
 *
 * Note this reads `headers()`, which marks a render dynamic. That is harmless
 * here because the logger is development-only by default, but it is the reason
 * enabling it in production is a deliberate opt-in.
 */
export const instrumentFetch = (): boolean => {
  if (!isEnabled()) return false;

  setLogIdResolver(async () => {
    const headers = await getHeadersFn();
    const store = await headers();

    return store.get(logIdRequestHeader) || undefined;
  });

  return instrumentGlobalFetch();
};

/**
 * Re-export as the GET handler of `app/__jsonrpc-log/[logId]/route.ts`. Draining
 * consumes the log, so a second read of the same id returns nothing rather than
 * replaying one render's calls onto another.
 */
export const GET = async (
  request: Request,
  context: { params: Promise<{ logId: string }> }
): Promise<Response> => {
  if (!isEnabled()) {
    return new Response(null, { status: 404 });
  }

  const { logId } = await context.params;
  const log = drainLog(logId);

  return new Response(JSON.stringify(log), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store'
    }
  });
};
