import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import GoogleAnalytics from '~/components/GoogleAnalytics';
import { siteUrl } from '~/lib/links';
import './globals.css';

const sans = Geist({ subsets: ['latin'], variable: '--font-sans' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

const title = 'JSON-RPC Chrome Viewer — JSON-RPC traffic, readable in DevTools';
const description = 'A Chrome DevTools panel that captures JSON-RPC over HTTP and WebSocket, '
  + 'splits batches, pairs requests with responses, mocks methods and shows the calls your server made.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'JSON-RPC Chrome Viewer',
  keywords: ['json-rpc', 'chrome extension', 'devtools', 'websocket', 'web3', 'debugging', 'mock'],
  openGraph: {
    type: 'website',
    title,
    description,
    url: '/',
    siteName: 'JSON-RPC Chrome Viewer',
    images: ['/icon.png']
  },
  twitter: { card: 'summary', title, description },
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
