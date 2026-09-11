/**
 * The `proxy.ts` entry (Next 16+). A subpath of its own rather than a reuse of
 * `./next/middleware`, so the import names exactly what Next looks for in that
 * file. It deliberately does not offer `config`: re-exporting one makes Next 16
 * warn on every request and ignore it (see `config` in `nextMiddleware.ts`).
 */
export { proxy } from './nextMiddleware.js';
