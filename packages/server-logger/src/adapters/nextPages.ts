import { runWithLog } from '../core/collector.js';
import { isEnabled } from '../core/options.js';
import { logIdRequestHeader } from '../core/types.js';

/**
 * The Pages Router half of the Next integration. `proxy.ts` mints the log id
 * and hands it to the render as a request header, exactly as it does for the
 * App Router — but `next/headers`, which the App Router path reads it back
 * through, throws outside an App Router request scope, so inside
 * `getServerSideProps` the fetch patch can find no id and records nothing.
 *
 * Here the id is instead read off `req.headers` and the handler runs inside the
 * collector's `AsyncLocalStorage` scope, which every `await` beneath it
 * inherits. The fetch patch then answers from that scope synchronously and the
 * `next/headers` resolver is never consulted.
 */

interface IIncomingRequestLike {
  headers?: Record<string, string | string[] | undefined>,
}

/**
 * `getServerSideProps` and `getInitialProps` receive `{ req }`; an API route
 * receives `req` itself. Both shapes are accepted, so one wrapper covers the
 * three places a Pages Router app makes server-side calls.
 */
const getLogId = (firstArg: unknown): string | undefined => {
  if (!firstArg || typeof firstArg !== 'object') return undefined;

  const candidate = firstArg as { req?: IIncomingRequestLike } & IIncomingRequestLike;
  const request = candidate.req ?? candidate;
  const value = request.headers?.[logIdRequestHeader];

  return typeof value === 'string' && value ? value : undefined;
};

type AnyHandler = (...args: never[]) => unknown;

/**
 * Wraps a `getServerSideProps`, a `getInitialProps` or an API route handler so
 * that the JSON-RPC calls it makes are attributed to the page render that
 * caused them. Transparent otherwise: the handler's arguments and result pass
 * through unchanged, and with the logger disabled or no id on the request it
 * is the bare handler.
 *
 *   export const getServerSideProps = withJsonRpcLog(async (context) => { ... });
 *
 * Or once, in whatever shared wrapper your pages already go through.
 */
export const withJsonRpcLog = <T extends AnyHandler>(handler: T): T => ((...args: Parameters<T>) => {
  const logId = isEnabled() ? getLogId(args[0]) : undefined;

  if (!logId) return handler(...args);

  return runWithLog(logId, () => handler(...args));
}) as T;
