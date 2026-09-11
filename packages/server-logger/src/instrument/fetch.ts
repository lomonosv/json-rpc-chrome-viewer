import { recordCall, resolveLogIdAsync } from '../core/collector.js';
import { createCallId } from '../core/encode.js';
import { isJsonRpcBody, truncateJsonRpcBody } from '../core/jsonRpc.js';
import { getOptions, isEnabled } from '../core/options.js';
import { drainPath } from '../core/types.js';

type Fetch = typeof globalThis.fetch;

/**
 * The one wrapper this process ever installs, plus what it delegates to.
 *
 * It is a single long-lived object rather than a fresh closure per install
 * because re-arming must swap what the wrapper *calls*, never add another layer
 * to the chain: two live copies of the wrapper would report every call twice,
 * and pointing the wrapper at a chain that already contains it loops forever.
 */
interface IFetchPatchState {
  /** Identity is how we recognise our own patch on `globalThis`. */
  patched: Fetch,
  /** The function the wrapper hands the call to. */
  native: Fetch,
  /**
   * Every function we have ever taken as a delegate. A host that evicts us puts
   * one of these back, so seeing one is proof we are out of the chain — and it
   * is the only such proof that survives several re-arms, since `origin` is
   * only ever the most recent one. Weak so that stale wrappers are not pinned
   * in memory for the life of a dev session.
   */
  seen: WeakSet<object>,
  /**
   * What sat on `globalThis.fetch` at the end of the last check: our own wrapper
   * when we were outermost, otherwise whoever had wrapped us. Comparing it to
   * what is there now is what tells eviction apart from being wrapped — see
   * `instrumentFetch`.
   */
  outer: Fetch,
}

const stateKey = Symbol.for('json-rpc-chrome-viewer.server-logger.fetch.v1');

interface IPatchedGlobal {
  [stateKey]?: IFetchPatchState,
}

/**
 * Reads the outgoing body only from shapes that can be read without consuming
 * anything. A ReadableStream body is skipped outright: draining it to look for
 * a JSON-RPC marker would break the very request we are supposed to leave
 * untouched.
 */
const readRequestBody = (body: unknown): string | null => {
  if (typeof body === 'string') return body;

  if (body instanceof Uint8Array) {
    try {
      return Buffer.from(body).toString('utf8');
    } catch (e) {
      return null;
    }
  }

  return null;
};

const getUrl = (input: unknown): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;

  return '';
};

const isDrainRequest = (url: string) => url.includes(drainPath);

const report = (
  callId: string,
  url: string,
  startTime: number,
  status: number,
  rawRequest: string,
  rawResponse: string,
  logId: string
) => {
  const { maxBodyBytes } = getOptions();
  const request = truncateJsonRpcBody(rawRequest, maxBodyBytes);
  const response = truncateJsonRpcBody(rawResponse, maxBodyBytes);

  recordCall({
    callId,
    url,
    startTime,
    time: Date.now() - startTime,
    status,
    rawRequest: request.body,
    rawResponse: response.body,
    ...(request.isTruncated || response.isTruncated ? { isTruncated: true } : {})
  }, logId);
};

const observeFetch = async (
  nativeFetch: Fetch,
  input: Parameters<Fetch>[0],
  init: Parameters<Fetch>[1],
  url: string,
  rawRequest: string
): Promise<Response> => {
  const callId = createCallId();
  const startTime = Date.now();

  // Fire before resolving the log id, so instrumentation never sits in front of
  // the request. The no-op catch only covers the window before the real handler
  // is attached below — without it a rejection landing inside that window is
  // reported as unhandled.
  const pending = nativeFetch(input, init);

  pending.catch(() => {});

  const logId = await resolveLogIdAsync();

  if (!logId) return pending;

  let response: Response;

  try {
    response = await pending;
  } catch (e) {
    // A rejected call is still a call worth listing, and rethrowing the original
    // rejection leaves the caller's error semantics untouched.
    report(callId, url, startTime, 0, rawRequest, '', logId);

    throw e;
  }

  let rawResponse = '';

  try {
    rawResponse = await response.clone().text();
  } catch (e) {
    // A consumed, streamed or aborted body must still produce a row — dropping
    // the report here would strand a call that demonstrably happened.
    rawResponse = '';
  }

  report(callId, url, startTime, response.status, rawRequest, rawResponse, logId);

  return response;
};

/**
 * The wrapper itself. Built once per process and held in `state`, which is also
 * where it reads the function to delegate to — so re-arming is a pointer swap,
 * not another layer.
 *
 * It stays cheap on the hot path: a plain function that hands straight back to
 * the delegate for anything that is not a JSON-RPC call, and only then goes to
 * the async observer.
 */
const createPatchedFetch = (state: IFetchPatchState): Fetch => ((input, init) => {
  const { native } = state;

  if (!isEnabled()) return native(input, init);

  let url = '';
  let rawRequest: string | null = null;

  try {
    url = getUrl(input);

    if (isDrainRequest(url)) return native(input, init);

    rawRequest = readRequestBody(init?.body);

    if (rawRequest === null || !isJsonRpcBody(rawRequest)) {
      return native(input, init);
    }
  } catch (e) {
    return native(input, init);
  }

  return observeFetch(native, input, init, url, rawRequest);
}) as Fetch;

const bind = (fetchFn: Fetch): Fetch => {
  try {
    return fetchFn.bind(globalThis) as Fetch;
  } catch (e) {
    return fetchFn;
  }
};

/**
 * Installs the patch, and puts it back when a host has thrown it away.
 *
 * **A one-shot install flag is not enough, and this is the bug it hid.**
 * `next dev` captures the pristine `fetch` at boot and restores it on every
 * recompile — `resetFetch()` in Next's `router-server.js`, called from the hot
 * reloader — and then re-patches its own wrapper over the bare function at the
 * next render. That evicts this wrapper while every other signal keeps working:
 * the id is still minted, the request header still reaches the render, the
 * resolver still answers. Only the calls go missing, so the failure reads as
 * "the logger is off" rather than "the patch is gone". Guarding on "have I
 * patched before" therefore made the logger work until the first recompile,
 * which in a real app is the first thing that happens.
 *
 * The hard part is that by the time we look, Next has usually re-patched, so
 * `globalThis.fetch` is a wrapper either way — being wrapped and being evicted
 * are the same picture. **Identity of the previous outer function is what tells
 * them apart**, and it is enough on its own:
 *
 * - it is our wrapper — we are outermost, nothing to do;
 * - it is a function we have wrapped before — a host put one back, which only
 *   happens when it has taken ours out; re-arm over it;
 * - it is unchanged since the last check — whatever we concluded then still
 *   holds;
 * - it changed, and last time *we* were outermost — something wrapped us, which
 *   is the normal case; we are inside it;
 * - it changed, and last time we were already inside someone else's wrapper —
 *   nothing but this function ever puts our wrapper back on `globalThis`, so a
 *   new outer function cannot contain it. We were evicted; re-arm.
 *
 * That last rule is what makes re-arming safe: we only ever take a delegate
 * that provably does not call back into us, so the chain cannot close into a
 * loop. The wrapper itself is built once and reads its delegate from `state`,
 * so re-arming is a pointer swap rather than another layer — two live copies
 * would report every call twice.
 *
 * Cheap enough to call on every request, which is what makes the recovery
 * automatic rather than something a host has to notice and trigger.
 */
export const instrumentFetch = (): boolean => {
  const target = globalThis as IPatchedGlobal;
  const current = globalThis.fetch;

  if (typeof current !== 'function') return false;

  const state = target[stateKey];

  if (!state) {
    const created = { seen: new WeakSet(), native: bind(current) } as IFetchPatchState;

    created.seen.add(current);
    created.patched = createPatchedFetch(created);
    created.outer = created.patched;
    target[stateKey] = created;
    globalThis.fetch = created.patched;

    return true;
  }

  if (current === state.patched) {
    state.outer = current;

    return false;
  }

  const wasOutermost = state.outer === state.patched;

  if (!state.seen.has(current)) {
    if (current === state.outer) return false;

    if (wasOutermost) {
      state.outer = current;

      return false;
    }
  }

  state.seen.add(current);
  state.native = bind(current);
  state.outer = state.patched;
  globalThis.fetch = state.patched;

  return true;
};

/** Restores the original function, for tests and for a host that toggles at runtime. */
export const uninstrumentFetch = (): boolean => {
  const target = globalThis as IPatchedGlobal;
  const state = target[stateKey];

  if (!state) return false;

  if (globalThis.fetch === state.patched) {
    globalThis.fetch = state.native;
  }

  delete target[stateKey];

  return true;
};
