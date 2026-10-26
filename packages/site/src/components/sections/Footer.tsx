import { githubUrl, issuesUrl, newTabProps, serverLoggerNpmUrl } from '~/lib/links';
import styles from './footer.module.css';

export default function Footer() {
  return (
    <footer className={ styles.footer }>
      <div className={ `container ${ styles.inner }` }>
        <p className={ styles.privacy }>
          Captured traffic never leaves your browser · no network-layer permissions · open source, MIT
        </p>
        <nav className={ styles.links } aria-label="Footer">
          <a href={ githubUrl } { ...newTabProps }>GitHub</a>
          <a href={ issuesUrl } { ...newTabProps }>Report an issue</a>
          <a href={ serverLoggerNpmUrl } { ...newTabProps }>server-logger</a>
        </nav>
      </div>
    </footer>
  );
}
