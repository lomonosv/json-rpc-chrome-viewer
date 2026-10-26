'use client';

import GradientText from '~/components/reactbits/GradientText/GradientText';
import StarBorder from '~/components/reactbits/StarBorder/StarBorder';
import Icon from '~/components/ui/Icon';
import Reveal from '~/components/ui/Reveal';
import { chromeWebStoreUrl, githubUrl, issuesUrl, newTabProps, serverLoggerNpmUrl } from '~/lib/links';
import styles from './finalCta.module.css';

export default function FinalCta() {
  return (
    <>
      <section className={ styles.section }>
        <div className={ `container ${ styles.inner }` }>
          <Reveal>
            <h2 className={ styles.title }>
              Stop clicking through <br />
              <GradientText colors={ ['#7cb4ff', '#22d3ee', '#a594ff', '#7cb4ff'] } animationSpeed={ 6 }>
                identical POSTs.
              </GradientText>
            </h2>
          </Reveal>
          <Reveal delay={ 0.1 }>
            <p className={ styles.lead }>Install in a click. Open DevTools. Find the call.</p>
          </Reveal>
          <Reveal delay={ 0.2 } className={ styles.ctas }>
            <StarBorder
              as="a"
              href={ chromeWebStoreUrl }
              { ...newTabProps }
              color="#7cb4ff"
              radius={ 999 }
              backgroundColor="#eef0f6"
              textColor="#05060a"
              className={ styles.primary }
            >
              <Icon name="chrome" size={ 18 } />
              Add to Chrome
            </StarBorder>
            <a href={ githubUrl } className={ styles.secondary }>
              <Icon name="github" size={ 18 } />
              View source
            </a>
          </Reveal>
        </div>
      </section>

      <footer className={ styles.footer }>
        <div className={ `container ${ styles.footerInner }` }>
          <span>© { new Date().getFullYear() } JSON-RPC Chrome Viewer · MIT</span>
          <nav className={ styles.footerLinks } aria-label="Footer">
            <a href={ githubUrl }>GitHub</a>
            <a href={ issuesUrl }>Report an issue</a>
            <a href={ serverLoggerNpmUrl }>server-logger</a>
            <a href="https://reactbits.dev/">Made with React Bits</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
