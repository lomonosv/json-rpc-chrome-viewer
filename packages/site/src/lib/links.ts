export const githubUrl = 'https://github.com/lomonosv/json-rpc-chrome-viewer';
export const issuesUrl = `${ githubUrl }/issues`;
export const serverCaptureDocsUrl = `${ githubUrl }/blob/main/docs/server-capture.md`;
export const serverLoggerNpmUrl = 'https://www.npmjs.com/package/@json-rpc-chrome-viewer/server-logger';

export const chromeWebStoreUrl =
  'https://chromewebstore.google.com/detail/json-rpc-chrome-viewer/bfkookcjhlalpmeedppachhdkhmflbah';

// The store listing opens in a new tab so the visitor keeps the site.
export const newTabProps = { target: '_blank', rel: 'noopener noreferrer' } as const;

// Absolute base for Open Graph urls; set NEXT_PUBLIC_SITE_URL to the deployed origin.
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
