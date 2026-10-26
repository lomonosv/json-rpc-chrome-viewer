import { join } from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Served by `node server.js` from the standalone output (see Dockerfile).
  output: 'standalone',
  // This is a workspace package: tracing has to start at the repo root, or the
  // standalone bundle misses the hoisted node_modules it imports from.
  outputFileTracingRoot: join(__dirname, '..', '..'),
  trailingSlash: true,
  // Nothing on the site needs resizing, and unoptimized images keep sharp out
  // of the image.
  images: { unoptimized: true },
  // Off because the vendored React Bits WebGL backgrounds call loseContext() in
  // their effect cleanup: Strict Mode's dev-only unmount/remount then hands the
  // remount a dead context and the canvas paints grey. Production is unaffected.
  reactStrictMode: false,
  poweredByHeader: false,
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // SAMEORIGIN, not DENY: the hero frames the live panel demo from /demo/.
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ]
    }
  ]
};

export default config;
