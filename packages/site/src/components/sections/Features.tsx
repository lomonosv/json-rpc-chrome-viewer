'use client';

import SpotlightCard from '~/components/reactbits/SpotlightCard/SpotlightCard';
import Icon, { type IconName } from '~/components/ui/Icon';
import Reveal from '~/components/ui/Reveal';
import SectionHeading from '~/components/ui/SectionHeading';
import styles from './features.module.css';

interface IFeature {
  icon: IconName,
  title: string,
  text: string,
  wide?: boolean,
}

const features: IFeature[] = [
  {
    icon: 'capture',
    title: 'Zero-config capture',
    text: 'Anything carrying "jsonrpc": "2.0" is picked up — no url patterns, no setup. '
      + 'Calls made before you opened the panel are buffered and still there.',
    wide: true
  },
  {
    icon: 'socket',
    title: 'WebSocket, too',
    text: 'Socket frames land in the same list, including SockJS’s double-encoded ones, with ▲/▼ direction.'
  },
  {
    icon: 'layers',
    title: 'Batches, exploded',
    text: 'One row per batch item, each paired with its response by id — an erroring item turns red on its own.'
  },
  {
    icon: 'timer',
    title: 'Waterfall with phases',
    text: 'Queueing, stalled, DNS, connect, SSL, send, wait and download — hover a bar for the same breakdown '
      + 'Chrome’s Network panel gives you.',
    wide: true
  },
  {
    icon: 'palette',
    title: 'Fits your dock',
    text: 'Panes, stacked, drawer, drill-down or accordion. Resizable, reorderable columns. '
      + 'Dark and light, ~35 JSON themes, and it folds gracefully into a narrow side dock.',
    wide: true
  },
  {
    icon: 'search',
    title: 'Search that reads JSON',
    text: 'Scope it to method, params, results or error codes. Matches light up in the list and both panes.'
  },
  {
    icon: 'replay',
    title: 'Resend & TypeScript',
    text: 'Edit a request body and fire it again, or turn any response into TypeScript types in one click.'
  },
  {
    icon: 'shield',
    title: 'Resilient capture',
    text: 'Requests in the Network tab but missing here? Another extension patching fetch — React DevTools 7 does — '
      + 'hides them from every DevTools panel. One toggle reads them inside the page instead, live while in flight.',
    wide: true
  }
];

export default function Features() {
  return (
    <section id="features" className={ styles.section }>
      <div className="container">
        <SectionHeading eyebrow="Features" title="Everything the Network tab can’t tell you">
          Built by someone who debugs JSON-RPC all day — every detail is about getting to the call you care about
          faster.
        </SectionHeading>

        <div className={ styles.grid }>
          { features.map((feature, index) => (
            <Reveal key={ feature.title } delay={ (index % 3) * 0.08 } className={ feature.wide ? styles.wide : '' }>
              <SpotlightCard className={ styles.card } spotlightColor="rgba(79, 140, 255, 0.22)">
                <span className={ styles.icon }><Icon name={ feature.icon } size={ 22 } /></span>
                <h3 className={ styles.title }>{ feature.title }</h3>
                <p className={ styles.text }>{ feature.text }</p>
              </SpotlightCard>
            </Reveal>
          )) }
        </div>
      </div>
    </section>
  );
}
