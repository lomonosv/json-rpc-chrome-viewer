/**
 * Reads the JSON-RPC calls a server made while handling one of its responses —
 * SSR renders, BFF handlers — which the browser never sees on the wire. The
 * server attaches them to that response (see docs/server-capture.md), either
 * inline in a header or as an id the panel drains from the server afterwards.
 *
 * Everything here is keyed off a response header, and a response without one
 * costs a single header scan and nothing more: no fetch, no parse, no row. That
 * is the compatibility guarantee — with no server logger installed, capture
 * behaves exactly as it did before this module existed.
 *
 * The constants and the call shape are duplicated from
 * packages/server-logger/src/core/types.ts rather than imported, because the
 * package entry pulls in node:zlib and node:async_hooks, which cannot enter the
 * panel bundle. Keep the two in step. The wire format is versioned, so an
 * emitter this panel does not understand is ignored rather than misread.
 */

const wireFormatVersion = 1;
const inlineLogHeader = 'x-json-rpc-log';
const deferredLogHeader = 'x-json-rpc-log-id';
const drainPath = '/__jsonrpc-log';

// A drain endpoint that hangs must not hold rows back indefinitely.
const drainTimeoutMs = 5000;

// The emitter mints UUIDs. Anything else is refused before it reaches a URL,
// since the id arrives in a header the page's server controls.
const logIdPattern = /^[A-Za-z0-9-]{1,128}$/;

export const serverLoggerPackageName = '@json-rpc-chrome-viewer/server-logger';
export const serverLoggerPackageUrl = 'https://www.npmjs.com/package/@json-rpc-chrome-viewer/server-logger';

export interface IServerRpcCall {
  url: string,
  startTime: number,
  time: number,
  status: number,
  rawRequest: string,
  rawResponse: string,
}

interface IResponseHeader {
  name: string,
  value: string,
}

const getResponseHeaders = (request: chrome.devtools.network.Request): IResponseHeader[] => (
  (request.response?.headers as IResponseHeader[]) || []
);

const findHeader = (request: chrome.devtools.network.Request, name: string): string | undefined => (
  getResponseHeaders(request).find((header) => header.name.toLowerCase() === name)?.value
);

/**
 * The navigation's own document — the request whose response carries the calls
 * the server made rendering the page. Chrome stamps `_resourceType` on every
 * HAR entry it hands to extensions; destructured, not dot-accessed, purely to
 * keep `no-underscore-dangle` quiet at this one boundary.
 */
export const isDocumentRequest = (request: chrome.devtools.network.Request): boolean => {
  const { _resourceType: resourceType } = request;

  return resourceType === 'document';
};

export const hasServerLog = (request: chrome.devtools.network.Request): boolean => (
  getResponseHeaders(request).some(({ name }) => {
    const lowerName = name.toLowerCase();

    return lowerName === inlineLogHeader || lowerName === deferredLogHeader;
  })
);

const toFiniteNumber = (value: unknown, fallback: number): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

/**
 * Rebuilds each call field by field, the same reflex as `normaliseRules()`:
 * the payload comes from a server this panel did not write, so nothing reaches
 * the request builder half-shaped. A call without a request body cannot be
 * rendered as a row and is dropped.
 */
const normaliseCall = (call: unknown): IServerRpcCall | null => {
  if (!call || typeof call !== 'object') return null;

  const fields = call as Record<string, unknown>;

  if (typeof fields.rawRequest !== 'string' || !fields.rawRequest) return null;

  return {
    url: typeof fields.url === 'string' ? fields.url : '',
    startTime: toFiniteNumber(fields.startTime, Date.now()),
    time: Math.max(toFiniteNumber(fields.time, 0), 0),
    status: toFiniteNumber(fields.status, 0),
    rawRequest: fields.rawRequest,
    rawResponse: typeof fields.rawResponse === 'string' ? fields.rawResponse : ''
  };
};

const normaliseLog = (log: unknown): IServerRpcCall[] => {
  if (!log || typeof log !== 'object') return [];

  const { v, calls } = log as { v?: unknown, calls?: unknown };

  if (v !== wireFormatVersion || !Array.isArray(calls)) return [];

  return calls.map(normaliseCall).filter(Boolean);
};

const decodeInlineLog = async (encoded: string): Promise<unknown> => {
  const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));

  return JSON.parse(await new Response(stream).text());
};

/**
 * Drains from the origin that emitted the id, since that server holds the log
 * in its own memory. The panel is an extension page with host permissions, so
 * the fetch is exempt from CORS without the server opting in — and it is not a
 * request in the inspected tab, so it never reappears in the list. Draining
 * consumes the log, which is what stops one render's calls being listed twice.
 */
const fetchDeferredLog = async (logId: string, responseUrl: string): Promise<unknown> => {
  if (!logIdPattern.test(logId)) return null;

  const { protocol, origin } = new URL(responseUrl);

  if (protocol !== 'http:' && protocol !== 'https:') return null;

  const response = await fetch(new URL(`${ drainPath }/${ logId }`, origin), {
    cache: 'no-store',
    credentials: 'omit',
    signal: AbortSignal.timeout(drainTimeoutMs)
  });

  return response.ok ? response.json() : null;
};

/**
 * Never throws. A malformed log, a drain endpoint that is down or slow, a body
 * that is not gzip — every failure lands on "no server rows", because nothing
 * here may break capture of the browser request the log rode in on.
 */
export const getServerLogCalls = async (request: chrome.devtools.network.Request): Promise<IServerRpcCall[]> => {
  try {
    const inlineLog = findHeader(request, inlineLogHeader);

    if (inlineLog) {
      return normaliseLog(await decodeInlineLog(inlineLog));
    }

    const logId = findHeader(request, deferredLogHeader);

    if (logId) {
      return normaliseLog(await fetchDeferredLog(logId, request.request.url));
    }
  } catch (e) {
    // Deliberately swallowed; see above.
  }

  return [];
};
