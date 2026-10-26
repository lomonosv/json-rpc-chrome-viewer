'use client';

import BlurText from '~/components/reactbits/BlurText/BlurText';
import GradientText from '~/components/reactbits/GradientText/GradientText';
import ShinyText from '~/components/reactbits/ShinyText/ShinyText';
import StarBorder from '~/components/reactbits/StarBorder/StarBorder';
import LiveDemo from '~/components/LiveDemo/LiveDemo';
import Icon from '~/components/ui/Icon';
import Reveal from '~/components/ui/Reveal';
import { chromeWebStoreUrl, githubUrl, newTabProps } from '~/lib/links';
import styles from './hero.module.css';

export default function Hero() {
  return (
    <section id="top" className={ styles.hero }>
      <div className={ styles.grid } aria-hidden="true" />

      <div className={ `container ${ styles.inner }` }>
        <Reveal y={ 12 }>
          <a href="#server" className={ styles.pill }>
            <span className={ styles.pillTag }>New</span>
            <ShinyText
              text="See the JSON-RPC calls your server made"
              speed={ 3 }
              color="#9aa1b4"
              shineColor="#ffffff"
            />
            <Icon name="arrow" size={ 14 } />
          </a>
        </Reveal>

        <h1 className={ styles.title }>
          <BlurText text="Every call is POST /rpc." animateBy="words" delay={ 90 } direction="top" trigger="load" />
          <span className={ styles.titleSecond }>
            <GradientText colors={ ['#7cb4ff', '#22d3ee', '#a594ff', '#7cb4ff'] } animationSpeed={ 6 }>
              Until now.
            </GradientText>
          </span>
        </h1>

        <Reveal delay={ 0.5 }>
          <p className={ styles.lead }>
            A Chrome DevTools panel that reads JSON-RPC the way you think about it — by method.
            HTTP and WebSocket, batches split apart, requests paired with responses, mocks on demand,
            and even the calls your server made while rendering the page.
          </p>
        </Reveal>

        <Reveal delay={ 0.7 } className={ styles.ctas }>
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
            Add to Chrome — it’s free
          </StarBorder>
          <a href={ githubUrl } className={ styles.secondary }>
            <Icon name="github" size={ 18 } />
            Star on GitHub
          </a>
        </Reveal>

        <Reveal delay={ 0.85 }>
          <p className={ styles.meta }>Manifest V3 · MIT licensed · no account, no telemetry on your traffic</p>
        </Reveal>

        <Reveal delay={ 0.4 } y={ 60 } className={ styles.panel }>
          <LiveDemo />
          <p className={ styles.hint }>
            This is the real panel running in your browser — click a row, use <kbd>↑</kbd> <kbd>↓</kbd>, filter,
            sort, resend, or open Settings.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
