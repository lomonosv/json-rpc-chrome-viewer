'use client';

import { useState } from 'react';
import Code from '~/components/ui/Code';
import Icon from '~/components/ui/Icon';
import Reveal from '~/components/ui/Reveal';
import SectionHeading from '~/components/ui/SectionHeading';
import { serverCaptureDocsUrl, serverLoggerNpmUrl } from '~/lib/links';
import styles from './serverCapture.module.css';

const installCommand = 'npm install --save-dev @json-rpc-chrome-viewer/server-logger';

const proxySource = `// proxy.ts — the whole Next.js 16 integration
export { proxy } from '@json-rpc-chrome-viewer/server-logger/next/proxy';`;

const steps = [
  { title: 'Your server renders', text: 'SSR pages and BFF handlers call JSON-RPC services the browser never sees.' },
  { title: 'The logger records', text: 'Each call is collected and tied to the browser request that caused it.' },
  {
    title: 'The panel shows it',
    text: 'A collapsible SERVER group sits above the page’s own calls, one per navigation.'
  }
];

export default function ServerCapture() {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1200);
    } catch {
      // Clipboard denied (insecure origin, permissions) — the command is still selectable.
    }
  };

  return (
    <section id="server" className={ styles.section }>
      <div className="container">
        <SectionHeading eyebrow="Server-side capture" title="See the calls your server made">
          The browser only sees half the story. Add the server logger to your app and the JSON-RPC calls made
          during a render show up in the same panel — no proxy to run, no extra tab.
        </SectionHeading>

        <div className={ styles.steps }>
          { steps.map((step, index) => (
            <Reveal key={ step.title } delay={ index * 0.1 } className={ styles.step }>
              <span className={ styles.stepIndex }>0{ index + 1 }</span>
              <h3>{ step.title }</h3>
              <p>{ step.text }</p>
            </Reveal>
          )) }
        </div>

        <Reveal delay={ 0.15 } className={ styles.codeCard }>
          <div className={ styles.install }>
            <span className={ styles.prompt }>$</span>
            <code>{ installCommand }</code>
            <button type="button" onClick={ copy } className={ styles.copy } aria-label="Copy install command">
              <Icon name={ isCopied ? 'check' : 'copy' } size={ 16 } />
            </button>
          </div>
          <Code className={ styles.code } language="ts" source={ proxySource } />
          <div className={ styles.notes }>
            <span>Next.js 16 App &amp; Pages Router · any Node server via the core API</span>
            <span>Off unless <code>NODE_ENV=development</code></span>
            <span className={ styles.links }>
              <a href={ serverLoggerNpmUrl }>npm</a>
              <a href={ serverCaptureDocsUrl }>Wire format →</a>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
