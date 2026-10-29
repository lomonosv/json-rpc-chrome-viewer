'use client';

import GradientText from '~/components/reactbits/GradientText/GradientText';
import StarBorder from '~/components/reactbits/StarBorder/StarBorder';
import LiveDemo from '~/components/LiveDemo/LiveDemo';
import Icon from '~/components/ui/Icon';
import { chromeWebStoreUrl, githubUrl, newTabProps } from '~/lib/links';
import styles from './hero.module.css';

// The live panel is the pitch: it shows the method list, batches, timing,
// errors and server calls better than any section describing them would.
export default function Hero() {
  return (
    <section id="top" className={ styles.hero }>
      <div className={ `container ${ styles.inner }` }>
        <h1 className={ styles.eyebrow }>JSON-RPC viewer and debugger for Chrome DevTools</h1>
        <p className={ styles.title }>
          <span className={ styles.titleLine }>
            Every call is <span className={ styles.nowrap }>POST /rpc.</span>
          </span>{ ' ' }
          <span className={ styles.titleLine }>
            <GradientText colors={ ['#7cb4ff', '#22d3ee', '#a594ff', '#7cb4ff'] } animationSpeed={ 6 }>
              Until now.
            </GradientText>
          </span>
        </p>

        <p className={ styles.lead }>
          Inspect JSON-RPC 2.0 calls by method — over HTTP and WebSocket, with each request paired to
          its response.
        </p>

        <div className={ styles.ctas }>
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
            Add to Chrome — free
          </StarBorder>
          <a href={ githubUrl } { ...newTabProps } className={ styles.secondary }>
            <Icon name="github" size={ 18 } />
            GitHub
          </a>
        </div>

        <div className={ styles.panel }>
          <LiveDemo />
          <p className={ styles.hint }>
            The real panel, running here — click a row, filter, sort or open Settings.
          </p>
        </div>
      </div>
    </section>
  );
}
