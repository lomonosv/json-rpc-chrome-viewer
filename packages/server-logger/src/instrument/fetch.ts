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
  /** Delegates displaced by later assignments, newest last; see the setter. */
  history: Fetch[],
}

/**
 * Enough for any realistic nesting of save/restore pairs. Older entries are
 * dropped rather than grown without bound, because `next dev` pushes one on
 * every recompile and never pops.
 */
const maxDelegateHistory = 16;

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

/**
 * Recording must never reach the caller. Everything above this point is chosen
 * so it cannot throw — the body comes from `JSON.parse`, so it has no cycles —
 * but "cannot throw" is an argument, and the caller here is the host's own
 * request. A thrown error would reject a `fetch` the application made, turning
 * a logging bug into a failed render, which on a shared environment means a
 * failed test rather than a missing row.
 */
const reportSafely = (
  callId: string,
  url: string,
  startTime: number,
  status: number,
  rawRequest: string,
  rawResponse: string,
  logId: string
) => {
  try {
    report(callId, url, startTime, status, rawRequest, rawResponse, logId);
  } catch (e) {
    // Deliberately swallowed; a missing row beats a broken request.
  }
};

/**
 * A real `Response` never throws here, but this wrapper sees whatever the host
 * installed under it — a mock, a proxy, a plain object from a test double — and
 * that is exactly what an environment running e2e suites is full of. Reading it
 * defensively keeps the boundary airtight rather than merely argued.
 */
const readStatus = (response: Response): number => {
  try {
    return response.status;
  } catch (e) {
    return 0;
  }
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
    reportSafely(callId, url, startTime, 0, rawRequest, '', logId);

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

  reportSafely(callId, url, startTime, readStatus(response), rawRequest, rawResponse, logId);

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
 * Takes `globalThis.fetch` as an accessor rather than a value, so that being
 * overwritten re-points the delegate instead of evicting the wrapper.
 *
 * **This is what makes the patch survive `next dev`.** Next captures the
 * pristine `fetch` at boot and restores it on every recompile (`resetFetch()`
 * in its `router-server.js`, called from the hot reloader). Re-arming per
 * request cannot win that race: the proxy runs *before* the render, so a reset
 * landing in between leaves the render unpatched, and the failure is silent —
 * the id is still minted and still travels to the render, the drain still
 * answers, so the panel asks for a log the server recorded nothing into and
 * gets `calls: []` back. Intermittently, because only a recompile triggers it.
 *
 * With the accessor installed, `globalThis.fetch = original` runs the setter:
 * the assignment is remembered as what we delegate to, and the getter keeps
 * handing out the wrapper. A host that then wraps what it reads simply becomes
 * the delegate, and the re-entry guard in `createPatchedFetch` keeps the round
 * trip from being observed twice.
 */
const installAccessor = (state: IFetchPatchState): boolean => {
  try {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      enumerable: true,
      get: () => state.patched,
      set: (next: unknown) => {
        if (typeof next !== 'function') return;

        /**
         * Assigning the wrapper back is the second half of a save/restore —
         * `const saved = globalThis.fetch` handed out the wrapper, not the
         * delegate, so this means "undo my swap", not "make the wrapper its
         * own delegate" (which would hang the first call through it).
         *
         * Every mocking library does this: MSW, nock, `vi.stubGlobal`. Simply
         * ignoring it left the mock installed for the life of the process.
         */
        if (next === state.patched) {
          const previous = state.history.pop();

          if (previous) state.native = previous;

          return;
        }

        state.history.push(state.native);

        if (state.history.length > maxDelegateHistory) state.history.shift();

        state.native = bind(next as Fetch);
      }
    });

    return true;
  } catch (e) {
    return false;
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
    // `patched` closes over the state it lives on, so it is filled in below
    // rather than in the literal.
    const created: IFetchPatchState = {
      patched: null as unknown as Fetch,
      native,
      root: native,
      reentry: new AsyncLocalStorage<true>(),
      history: []
    };

    created.patched = createPatchedFetch(created);
    target[stateKey] = created;

    // A frozen or non-configurable `fetch` cannot take an accessor; fall back
    // to a plain assignment, which is the pre-accessor behaviour.
    if (!installAccessor(created)) globalThis.fetch = created.patched;

    return true;
  }

  if (current === state.patched) return false;

  // Reached only when something replaced the property itself rather than
  // assigning through the setter — another `defineProperty`, or the assignment
  // fallback above. Take the delegate and re-install.
  state.native = bind(current);

  if (!installAccessor(state)) globalThis.fetch = state.patched;

  return true;
};

/** Restores the original function, for tests and for a host that toggles at runtime. */
export const uninstrumentFetch = (): boolean => {
  const target = globalThis as IPatchedGlobal;
  const state = target[stateKey];

  if (!state) return false;

  const { native } = state;

  delete target[stateKey];

  // Put the delegate back as a plain data property: leaving the accessor in
  // place would keep handing out the wrapper after it has been uninstalled.
  try {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: native
    });
  } catch (e) {
    globalThis.fetch = native;
  }

  return true;
};
