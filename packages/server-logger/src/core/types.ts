/**
 * The wire format shared by every emitter and by the panel.
 *
 * It is a public compatibility surface: the moment a server emits it, an older
 * panel may be the thing reading it, and a newer panel may be reading output
 * from an older emitter. `wireFormatVersion` is what lets either side decline
 * a shape it does not understand instead of half-parsing it.
 */
export const wireFormatVersion = 1;

/** One JSON-RPC call the server made while handling an incoming request. */
export interface IServerRpcCall {
  /** Correlates the call across reports; minted once, at the point of the call. */
  callId: string,
  /** The endpoint the server called, not the endpoint the browser called. */
  url: string,
  /** Epoch ms, measured on the server clock. */
  startTime: number,
  /** Duration in ms. */
  time: number,
  /** Transport status; 0 when the call threw before a response arrived. */
  status: number,
  /** The request body verbatim, or with oversized members replaced. */
  rawRequest: string,
  /** The response body verbatim, or with oversized members replaced. */
  rawResponse: string,
  /** Set when either body had members replaced to fit the size cap. */
  isTruncated?: boolean,
}

/** The envelope carried inline in a header, or served by the drain endpoint. */
export interface IServerRpcLog {
  v: number,
  logId: string,
  calls: IServerRpcCall[],
}

/**
 * Carries the whole payload on the response of the request that caused the
 * calls. Base64 of gzip of the JSON envelope.
 */
export const inlineLogHeader = 'x-json-rpc-log';

/**
 * Carries only an id; the payload is pulled from the drain endpoint afterwards.
 * This is the mode that works for framework renders that cannot set a response
 * header from inside the render (Next.js App Router pages, notably).
 */
export const deferredLogHeader = 'x-json-rpc-log-id';

/** Request header the deferred mode uses to propagate the id into the render. */
export const logIdRequestHeader = 'x-json-rpc-log-id';

/** Path the drain endpoint is mounted at; `${drainPath}/<logId>`. */
export const drainPath = '/__jsonrpc-log';
