import { gunzipSync, gzipSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';
import { getOptions } from './options.js';
import type { IServerRpcLog } from './types.js';
import { wireFormatVersion } from './types.js';

export const createLogId = (): string => randomUUID();

export const createCallId = (): string => randomUUID();

/**
 * Encodes the envelope for the inline header. Returns null when the result
 * would not fit — the caller then emits nothing rather than a header a proxy
 * will reject or Node will refuse to write, and the deferred mode is the
 * answer for payloads of that size.
 */
export const encodeInlineLog = (log: IServerRpcLog): string | null => {
  if (!log.calls.length) return null;

  try {
    const encoded = gzipSync(Buffer.from(JSON.stringify(log), 'utf8')).toString('base64');

    return encoded.length > getOptions().maxInlineBytes ? null : encoded;
  } catch (e) {
    return null;
  }
};

/**
 * The inverse, for tests and for servers that proxy the header onward. The
 * panel decodes in the browser with DecompressionStream instead; both sides
 * must accept exactly what this produces.
 */
export const decodeInlineLog = (encoded: string): IServerRpcLog | null => {
  try {
    const log = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'));

    return log?.v === wireFormatVersion ? log : null;
  } catch (e) {
    return null;
  }
};
