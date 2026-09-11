import { AsyncLocalStorage } from 'node:async_hooks';
import { getOptions, isEnabled } from './options.js';
import type { IServerRpcCall, IServerRpcLog } from './types.js';
import { wireFormatVersion } from './types.js';

interface ILogEntry {
  logId: string,
  calls: IServerRpcCall[],
  expiresAt: number,
}

type LogIdResolver = () => string | undefined | Promise<string | undefined>;

interface ICollectorState {
  /**
   * Used by adapters that own the request lifecycle (Express, Fastify,
   * node:http). Framework renders that do not run inside our own scope — a
   * Next.js App Router page, where the id arrives on the incoming request
   * headers instead — go through `resolveFromHost`.
   */
  storage: AsyncLocalStorage<string>,
  /**
   * Insertion-ordered, which is what makes the oldest entry the first key.
   * Sweeping is lazy: a dev server that stops receiving requests should not
   * keep a timer alive, and there is nothing to reclaim while nothing arrives.
   */
  logs: Map<string, ILogEntry>,
  resolveFromHost: LogIdResolver,
}

/**
 * Process-wide, not module-scoped — and this is load-bearing. Next's App Router
 * bundles node_modules into each server entry, so `instrumentation.ts` (where
 * the fetch patch records) and the drain route each load their own copy of this
 * module. Module-level state gave each copy its own ring buffer: calls were
 * recorded into one and drained from another, so every drain came back empty.
 * The key carries a shape version so that a second, different copy of the
 * package cannot misread this one's state.
 */
const stateKey = Symbol.for('json-rpc-chrome-viewer.server-logger.collector.v1');

interface IStateGlobal {
  [stateKey]?: ICollectorState,
}

const getState = (): ICollectorState => {
  const target = globalThis as IStateGlobal;

  if (!target[stateKey]) {
    target[stateKey] = {
      storage: new AsyncLocalStorage<string>(),
      logs: new Map<string, ILogEntry>(),
      resolveFromHost: () => undefined
    };
  }

  return target[stateKey];
};

/**
 * Lets an adapter teach the collector how to find the current log id when the
 * call does not run inside `runWithLog` — the Next.js adapter reads it off the
 * incoming request headers.
 *
 * The resolver may be async, because that is what the App Router requires:
 * `next/headers` returns a promise. Only the slow path awaits
 * it, so a host that answers synchronously still costs nothing.
 */
export const setLogIdResolver = (resolver: LogIdResolver) => {
  getState().resolveFromHost = resolver;
};

const sweep = (now: number) => {
  const { logs } = getState();
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
  const { logs } = getState();
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
export const resolveLogId = (): string | undefined => getState().storage.getStore();

/** Resolves through the host resolver too, awaiting it when it is async. */
export const resolveLogIdAsync = async (): Promise<string | undefined> => {
  const state = getState();
  const fromStorage = state.storage.getStore();

  if (fromStorage) return fromStorage;

  try {
    return await state.resolveFromHost();
  } catch (e) {
    // A resolver reaching for framework request context throws outside a
    // request scope. That is not an error here, just "no log".
    return undefined;
  }
};

/** Runs `fn` with every recorded call attributed to `logId`. */
export const runWithLog = <T>(logId: string, fn: () => T): T => (
  getState().storage.run(logId, fn)
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
export const peekLog = (logId: string): IServerRpcLog => toLog(getState().logs.get(logId), logId);

/**
 * Reads a log and drops it. The drain endpoint consumes, so a page reloaded
 * twice cannot serve the first render's calls to the second.
 */
export const drainLog = (logId: string): IServerRpcLog => {
  const log = peekLog(logId);

  getState().logs.delete(logId);

  return log;
};

export const hasLog = (logId: string): boolean => getState().logs.has(logId);

/** Test seam. */
export const clearLogs = () => getState().logs.clear();
