import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import GoogleAnalytics from '~/components/GoogleAnalytics';
import { siteUrl } from '~/lib/links';
import './globals.css';

const sans = Geist({ subsets: ['latin'], variable: '--font-sans' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

const title = 'JSON-RPC Chrome Viewer: JSON-RPC debugger for DevTools';
const description = 'Inspect, debug and mock JSON-RPC 2.0 calls in Chrome DevTools - every request by method, '
  + 'over HTTP and WebSocket. Free and open source.';
const imageAlt = 'JSON-RPC Chrome Viewer panel listing JSON-RPC calls by method in Chrome DevTools';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'JSON-RPC Chrome Viewer',
  keywords: [
    'json-rpc', 'json rpc', 'jsonrpc', 'json-rpc viewer', 'json-rpc debugger', 'json-rpc chrome extension',
    'json-rpc devtools', 'json-rpc websocket', 'mock json-rpc', 'ethereum json-rpc', 'web3', 'chrome devtools'
  ],
  openGraph: {
    type: 'website',
    title,
    description,
    url: '/',
    siteName: 'JSON-RPC Chrome Viewer',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: imageAlt }]
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
  alternates: { canonical: '/' }
};

export const viewport: Viewport = {
  themeColor: '#05060a',
  colorScheme: 'dark'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={ `${ sans.variable } ${ mono.variable }` }>
      <body>
        { children }
        <GoogleAnalytics />
      </body>
    </html>
  );
}
