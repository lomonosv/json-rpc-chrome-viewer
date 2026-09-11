/** Everything tunable, in one place, with the safe value as the default. */
export interface ILoggerOptions {
  /**
   * Master switch. Defaults to `NODE_ENV !== 'production'`: this ships request
   * and response bodies to whoever can read the response, so production is
   * opt-in rather than opt-out.
   */
  isEnabled?: boolean,
  /** Per-body cap before members are replaced with a marker. */
  maxBodyBytes?: number,
  /** Cap on the encoded inline header; over this, inline emission is skipped. */
  maxInlineBytes?: number,
  /** Calls retained per log before the oldest are dropped. */
  maxCallsPerLog?: number,
  /** Logs retained in the ring buffer before the oldest are dropped. */
  maxLogs?: number,
  /** How long an undrained log survives, in ms. */
  logTtlMs?: number,
}

type ResolvedOptions = Required<ILoggerOptions>;

const isDevelopment = () => process.env.NODE_ENV !== 'production';

const defaultOptions: ResolvedOptions = {
  isEnabled: isDevelopment(),
  maxBodyBytes: 64 * 1024,
  // Node caps outgoing headers around 16KB; leave room for everything else.
  maxInlineBytes: 12 * 1024,
  maxCallsPerLog: 200,
  maxLogs: 100,
  logTtlMs: 60_000
};

/**
 * Process-wide rather than module-scoped, for the same reason as the collector
 * state: a bundler may load several copies of this module into one process, and
 * `configure()` called through one must govern the others.
 */
const optionsKey = Symbol.for('json-rpc-chrome-viewer.server-logger.options.v1');

interface IOptionsGlobal {
  [optionsKey]?: ResolvedOptions,
}

const target = globalThis as IOptionsGlobal;

export const getOptions = (): ResolvedOptions => {
  if (!target[optionsKey]) {
    target[optionsKey] = { ...defaultOptions };
  }

  return target[optionsKey];
};

export const configure = (next: ILoggerOptions = {}) => {
  target[optionsKey] = { ...defaultOptions, ...getOptions(), ...next };

  return target[optionsKey];
};

export const isEnabled = () => getOptions().isEnabled;

/** Test seam; also what a host calls to drop every buffered body at once. */
export const resetOptions = () => {
  target[optionsKey] = { ...defaultOptions };
};
