import { AsyncLocalStorage } from 'node:async_hooks';
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
 * to the chain: two live copies of the wrapper would report every call twice.
 */
interface IFetchPatchState {
  /** Identity is how we recognise our own patch on `globalThis`. */
  patched: Fetch,
  /** The function the wrapper hands a call to. Re-pointed on every re-arm. */
  native: Fetch,
  /**
   * The very first function we ever replaced — the real fetch, or whatever
   * chain sat under us at install, which by construction cannot call back into
   * us. A re-entered call goes straight here; see `createPatchedFetch`.
   */
  root: Fetch,
  /** Marks a call that is already inside the wrapper; see `createPatchedFetch`. */
  reentry: AsyncLocalStorage<true>,
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
 * **It cannot be made to loop, and that is what lets `instrumentFetch` re-arm
 * without proving anything about the chain.** Re-arming points `native` at
 * whatever is on `globalThis.fetch`, which after a host has wrapped us is a
 * function that calls *this wrapper* — Next's patched fetcher wraps whatever it
 * finds. Left alone, that is a cycle. So every call runs its delegate inside a
 * `reentry` scope, and a call that arrives while that scope is open is the
 * same request coming back round: it goes straight to `root`, the real fetch,
 * and is not observed a second time. The scope is an `AsyncLocalStorage`, not a
 * counter, because the wrapper in between may await before it calls us back.
 *
 * It stays cheap on the hot path otherwise: a plain function that hands
 * straight back to the delegate for anything that is not a JSON-RPC call, and
 * only then goes to the async observer.
 */
const createPatchedFetch = (state: IFetchPatchState): Fetch => ((input, init) => {
  if (state.reentry.getStore()) return state.root(input, init);

  return state.reentry.run(true, () => {
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
  });
}) as Fetch;

const bind = (fetchFn: Fetch): Fetch => {
  try {
    return fetchFn.bind(globalThis) as Fetch;
  } catch (e) {
    return fetchFn;
  }
};

/**
 * Installs the patch, and puts it back whenever it is not the outermost fetch.
 *
 * **A one-shot install flag is not enough, and this is the bug it hid.**
 * `next dev` captures the pristine `fetch` at boot and restores it on every
 * recompile — `resetFetch()` in Next's `router-server.js`, called from the hot
 * reloader — then re-patches its own wrapper over the bare function at the
 * next render. That evicts this wrapper while every other signal keeps working:
 * the id is still minted, the request header still reaches the render, the
 * resolver still answers. Only the calls go missing, so the failure reads as
 * "the logger is off" rather than "the patch is gone". And it is the cold-start
 * default, not an edge case: the first request after `next dev` starts compiles
 * the page, so the reset lands mid-request, after this has armed — and plain
 * refreshes never recompile, so nothing heals it.
 *
 * Once Next has re-patched, being wrapped and being evicted look identical from
 * here, and an earlier version tried to tell them apart by remembering what the
 * outer function had been last time. That inference was wrong exactly in the
 * cold-start case above, and getting it wrong the other way would have built a
 * loop. So there is no inference: whenever `globalThis.fetch` is not our
 * wrapper, take it as the delegate and put the wrapper back on top. The wrapper
 * is loop-proof by construction (see `createPatchedFetch`), which is the only
 * reason this is safe. Steady state costs one identity comparison per request;
 * a host wrapping us costs one pointer swap, and a call then travels
 * wrapper → host → wrapper (re-entered, straight to `root`) → network, observed
 * once.
 */
export const instrumentFetch = (): boolean => {
  const target = globalThis as IPatchedGlobal;
  const current = globalThis.fetch;

  if (typeof current !== 'function') return false;

  const state = target[stateKey];

  if (!state) {
    const native = bind(current);
    const created = { native, root: native, reentry: new AsyncLocalStorage<true>() } as IFetchPatchState;

    created.patched = createPatchedFetch(created);
    target[stateKey] = created;
    globalThis.fetch = created.patched;

    return true;
  }

  if (current === state.patched) return false;

  state.native = bind(current);
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
