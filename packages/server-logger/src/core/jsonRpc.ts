/**
 * Detection is a regex against the raw body rather than a JSON parse, matching
 * what the panel does — it has to tolerate double-encoded string frames, and a
 * parse on every outgoing request would be a real cost on a hot server path.
 *
 * Keep this expression identical to `jsonRPCRegex` in the panel's `filters.ts`;
 * a body one side calls JSON-RPC and the other does not produces rows that
 * arrive with no matching parse.
 */
const jsonRpcRegex = /jsonrpc\\?["']?\s*:\s*\\?["']?2\.0\\?["']?/;

export const isJsonRpcBody = (body: string): boolean => (
  typeof body === 'string' && jsonRpcRegex.test(body)
);

const parse = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const byteLength = (value: string) => Buffer.byteLength(value, 'utf8');

const truncatedMarker = (bytes: number) => `[truncated ${ bytes } bytes]`;

/**
 * Replaces oversized members rather than cutting the string, so the result is
 * still parseable JSON-RPC. A cut string would reach the panel as an unparseable
 * body, which renders as a warning row with no method — strictly worse than a
 * row whose params say they were dropped.
 *
 * Returns the body unchanged when it already fits, and an empty string when it
 * is too large but cannot be parsed (there is nothing safe to trim).
 */
export const truncateJsonRpcBody = (
  raw: string,
  maxBodyBytes: number
): { body: string, isTruncated: boolean } => {
  if (!raw || byteLength(raw) <= maxBodyBytes) {
    return { body: raw || '', isTruncated: false };
  }

  const json = parse(raw);

  if (!json) {
    return { body: '', isTruncated: true };
  }

  const items = Array.isArray(json) ? json : [json];
  // Share the budget across a batch so one huge item cannot spend all of it.
  const perItemBytes = Math.max(Math.floor(maxBodyBytes / items.length), 1024);

  items.forEach((item) => {
    if (!item || typeof item !== 'object') return;

    ['params', 'result', 'error'].forEach((key) => {
      if (!(key in item)) return;

      const serialised = JSON.stringify(item[key]) || '';

      if (byteLength(serialised) > perItemBytes) {
        item[key] = truncatedMarker(byteLength(serialised));
      }
    });
  });

  const body = JSON.stringify(Array.isArray(json) ? items : items[0]);

  // Still over budget means the overflow was in members we must not touch
  // (`id`, `method`); an unparseable body is worse than no body.
  return byteLength(body) > maxBodyBytes
    ? { body: '', isTruncated: true }
    : { body, isTruncated: true };
};
