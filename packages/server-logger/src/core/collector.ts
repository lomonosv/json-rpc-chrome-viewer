import { AsyncLocalStorage } from 'node:async_hooks';
import { getOptions, isEnabled } from './options.js';
import type { IServerRpcCall, IServerRpcLog } from './types.js';
import { wireFormatVersion } from './types.js';

interface ILogEntry {
  logId: string,
  calls: IServerRpcCall[],
  expiresAt: number,
}

/**
 * Used by adapters that own the request lifecycle (Express, Fastify, node:http).
 * Framework renders that do not run inside our own scope — a Next.js App Router
 * page, where the id arrives on the incoming request headers instead — go
 * through a resolver instead; see `setLogIdResolver`.
 */
const storage = new AsyncLocalStorage<string>();

/**
 * Insertion-ordered, which is what makes the oldest entry the first key.
 * Sweeping is lazy: a dev server that stops receiving requests should not keep
 * a timer alive, and there is nothing to reclaim while nothing is arriving.
 */
const logs = new Map<string, ILogEntry>();

type LogIdResolver = () => string | undefined | Promise<string | undefined>;

let resolveFromHost: LogIdResolver = () => undefined;

/**
 * Lets an adapter teach the collector how to find the current log id when the
 * call does not run inside `runWithLog` — the Next.js adapter reads it off the
 * incoming request headers.
 *
 * The resolver may be async, because that is what the App Router requires:
 * `next/headers` returns a promise from Next 15 on. Only the slow path awaits
 * it, so a host that answers synchronously still costs nothing.
 */
export const setLogIdResolver = (resolver: LogIdResolver) => {
  resolveFromHost = resolver;
};

const sweep = (now: number) => {
  const { maxLogs } = getOptions();

  logs.forEach((entry, logId) => {
    if (entry.expiresAt <= now) {
      logs.delete(logId);
    }
  });

  while (logs.size > maxLogs) {
    const oldest = logs.keys().next().value;

    if (oldest === undefined) break;

    logs.delete(oldest);
  }
};

const getEntry = (logId: string): ILogEntry => {
  const now = Date.now();
  const existing = logs.get(logId);

  if (existing) {
    existing.expiresAt = now + getOptions().logTtlMs;

    return existing;
  }

  const entry: ILogEntry = { logId, calls: [], expiresAt: now + getOptions().logTtlMs };

  logs.set(logId, entry);
  sweep(now);

  return entry;
};

/**
 * Resolves the log the current call belongs to without awaiting anything.
 * Returns undefined when only an async host resolver can answer.
 */
export const resolveLogId = (): string | undefined => storage.getStore();

/** Resolves through the host resolver too, awaiting it when it is async. */
export const resolveLogIdAsync = async (): Promise<string | undefined> => {
  const fromStorage = storage.getStore();

  if (fromStorage) return fromStorage;

  try {
    return await resolveFromHost();
  } catch (e) {
    // A resolver reaching for framework request context throws outside a
    // request scope. That is not an error here, just "no log".
    return undefined;
  }
};

/** Runs `fn` with every recorded call attributed to `logId`. */
export const runWithLog = <T>(logId: string, fn: () => T): T => (
  storage.run(logId, fn)
);

export const recordCall = (call: IServerRpcCall, logId = resolveLogId()) => {
  if (!isEnabled() || !logId) return;

  const entry = getEntry(logId);

  entry.calls.push(call);

  const { maxCallsPerLog } = getOptions();

  if (entry.calls.length > maxCallsPerLog) {
    entry.calls.splice(0, entry.calls.length - maxCallsPerLog);
  }
};

const toLog = (entry: ILogEntry | undefined, logId: string): IServerRpcLog => ({
  v: wireFormatVersion,
  logId,
  calls: entry ? entry.calls : []
});

/** Reads a log without consuming it. */
export const peekLog = (logId: string): IServerRpcLog => toLog(logs.get(logId), logId);

/**
 * Reads a log and drops it. The drain endpoint consumes, so a page reloaded
 * twice cannot serve the first render's calls to the second.
 */
export const drainLog = (logId: string): IServerRpcLog => {
  const log = peekLog(logId);

  logs.delete(logId);

  return log;
};

export const hasLog = (logId: string): boolean => logs.has(logId);

/** Test seam. */
export const clearLogs = () => logs.clear();
