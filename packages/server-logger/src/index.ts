import { recordCall, resolveLogIdAsync } from './core/collector.js';
import { createCallId } from './core/encode.js';
import { truncateJsonRpcBody } from './core/jsonRpc.js';
import { getOptions, isEnabled } from './core/options.js';

export type { ILoggerOptions } from './core/options.js';
export type { IServerRpcCall, IServerRpcLog } from './core/types.js';
export {
  deferredLogHeader,
  drainPath,
  inlineLogHeader,
  logIdRequestHeader,
  wireFormatVersion
} from './core/types.js';
export { configure, resetOptions } from './core/options.js';
export {
  clearLogs,
  drainLog,
  hasLog,
  peekLog,
  resolveLogId,
  resolveLogIdAsync,
  runWithLog,
  setLogIdResolver
} from './core/collector.js';
export { createCallId, createLogId, decodeInlineLog, encodeInlineLog } from './core/encode.js';
export { isJsonRpcBody, truncateJsonRpcBody } from './core/jsonRpc.js';
export { instrumentFetch, uninstrumentFetch } from './instrument/fetch.js';

export interface IRecordRpcCallInput {
  url: string,
  rawRequest: string,
  rawResponse?: string,
  status?: number,
  /** Epoch ms; defaults to `Date.now() - time`. */
  startTime?: number,
  /** Duration in ms. */
  time?: number,
  callId?: string,
  logId?: string,
}

/**
 * The escape hatch for clients the fetch patch cannot see — an axios instance
 * on a custom agent, a gRPC-over-HTTP bridge, a driver with its own transport.
 * This is what keeps the package useful beyond Node's global fetch, and the
 * adapters add nothing on top of it.
 */
export const recordRpcCall = async (input: IRecordRpcCallInput): Promise<boolean> => {
  if (!isEnabled()) return false;

  // Async because the App Router can only answer "which request am I in" from a
  // promise; a caller that does not care about the answer can ignore it.
  const logId = input.logId || await resolveLogIdAsync();

  if (!logId) return false;

  const { maxBodyBytes } = getOptions();
  const time = input.time ?? 0;
  const request = truncateJsonRpcBody(input.rawRequest, maxBodyBytes);
  const response = truncateJsonRpcBody(input.rawResponse || '', maxBodyBytes);

  recordCall({
    callId: input.callId || createCallId(),
    url: input.url,
    startTime: input.startTime ?? Date.now() - time,
    time,
    status: input.status ?? 0,
    rawRequest: request.body,
    rawResponse: response.body,
    ...(request.isTruncated || response.isTruncated ? { isTruncated: true } : {})
  }, logId);

  return true;
};
