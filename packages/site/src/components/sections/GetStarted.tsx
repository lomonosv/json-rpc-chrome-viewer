'use client';

import { useState } from 'react';
import Code from '~/components/ui/Code';
import Icon from '~/components/ui/Icon';
import { chromeWebStoreUrl, newTabProps, serverCaptureDocsUrl, serverLoggerNpmUrl } from '~/lib/links';
import styles from './getStarted.module.css';

const installCommand = 'npm install --save-dev @json-rpc-chrome-viewer/server-logger';

const proxySource = `// proxy.ts — the whole Next.js 16 integration
export { proxy } from '@json-rpc-chrome-viewer/server-logger/next/proxy';`;

export default function GetStarted() {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1200);
    } catch {
      // Clipboard denied (insecure origin, permissions) - the command is still selectable.
    }
  };

  return (
    <section id="start" className={ styles.section }>
      <div className={ `container ${ styles.layout }` }>
        <div>
          <h2 className={ styles.heading }>Get started</h2>
          <ol className={ styles.steps }>
            <li>
              <a href={ chromeWebStoreUrl } { ...newTabProps }>Add the extension</a> from the Chrome Web Store.
            </li>
            <li>Open DevTools and pick the <strong>JSON-RPC Chrome Viewer</strong> tab.</li>
            <li>
              Use your app — calls appear by method as they happen, including ones made before you opened the tab.
            </li>
          </ol>
        </div>

        <div className={ styles.card }>
          <div className={ styles.cardHeader }>
            <span>Optional: server-side calls</span>
            <span className={ styles.links }>
              <a href={ serverLoggerNpmUrl } { ...newTabProps }>npm</a>
              <a href={ serverCaptureDocsUrl } { ...newTabProps }>Docs</a>
            </span>
          </div>
          <div className={ styles.install }>
            <span className={ styles.prompt }>$</span>
            <code>{ installCommand }</code>
            <button type="button" onClick={ copy } className={ styles.copy } aria-label="Copy install command">
              <Icon name={ isCopied ? 'check' : 'copy' } size={ 15 } />
            </button>
          </div>
          <Code className={ styles.code } language="ts" source={ proxySource } />
          <p className={ styles.note }>
            Next.js 16 App and Pages Router, or any Node server through the core API. Inert unless
            <code> NODE_ENV=development</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
