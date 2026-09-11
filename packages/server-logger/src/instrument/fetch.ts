import { recordCall, resolveLogIdAsync } from '../core/collector.js';
import { createCallId } from '../core/encode.js';
import { isJsonRpcBody, truncateJsonRpcBody } from '../core/jsonRpc.js';
import { getOptions, isEnabled } from '../core/options.js';
import { drainPath } from '../core/types.js';

type Fetch = typeof globalThis.fetch;

const patchedFlag = Symbol.for('json-rpc-chrome-viewer.fetchPatched');

interface IPatchedGlobal {
  [patchedFlag]?: Fetch,
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
 * Installs the patch. It stays cheap on the hot path: the wrapper is a plain
 * function that hands straight back to the native fetch for anything that is
 * not a JSON-RPC call inside a request scope, and only then delegates to the
 * async observer.
 */
export const instrumentFetch = (): boolean => {
  const target = globalThis as IPatchedGlobal;

  if (target[patchedFlag] || typeof globalThis.fetch !== 'function') {
    return false;
  }

  const nativeFetch = globalThis.fetch.bind(globalThis) as Fetch;

  const patchedFetch = ((input, init) => {
    if (!isEnabled()) return nativeFetch(input, init);

    let url = '';
    let rawRequest: string | null = null;

    try {
      url = getUrl(input);

      if (isDrainRequest(url)) return nativeFetch(input, init);

      rawRequest = readRequestBody(init?.body);

      if (rawRequest === null || !isJsonRpcBody(rawRequest)) {
        return nativeFetch(input, init);
      }
    } catch (e) {
      return nativeFetch(input, init);
    }

    return observeFetch(nativeFetch, input, init, url, rawRequest);
  }) as Fetch;

  globalThis.fetch = patchedFetch;
  target[patchedFlag] = nativeFetch;

  return true;
};

/** Restores the original function, for tests and for a host that toggles at runtime. */
export const uninstrumentFetch = (): boolean => {
  const target = globalThis as IPatchedGlobal;
  const nativeFetch = target[patchedFlag];

  if (!nativeFetch) return false;

  globalThis.fetch = nativeFetch;
  delete target[patchedFlag];

  return true;
};
