import styles from './liveDemo.module.css';

const tabs = ['Elements', 'Console', 'Sources', 'Network', 'Performance', 'Application'];

// The extension's real panel, running from its own bundle with a stubbed
// `chrome` API (see demo/stub.js), framed by a DevTools-style tab strip. An
// iframe because the panel is a whole document of its own: global styles,
// body classes for the theme, a document-level keydown handler.
export default function LiveDemo() {
  return (
    <div className={ styles.window }>
      <div className={ styles.tabStrip }>
        <span className={ styles.tool } aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 4h10M4 4v10m0-10 16 16m-6 0h6v-6" />
          </svg>
        </span>
        <span className={ styles.tool } aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="7" y="3" width="10" height="18" rx="2" />
          </svg>
        </span>
        <span className={ styles.divider } aria-hidden="true" />
        <nav className={ styles.tabs } aria-hidden="true">
          { tabs.map((tab) => <span key={ tab } className={ styles.tab }>{ tab }</span>) }
          <span className={ `${ styles.tab } ${ styles.active }` }>JSON-RPC Chrome Viewer</span>
        </nav>
      </div>
      <iframe
        className={ styles.frame }
        src="/demo/index.html?theme=dark"
        title="JSON-RPC Chrome Viewer panel, live demo"
      />
    </div>
  );
}
