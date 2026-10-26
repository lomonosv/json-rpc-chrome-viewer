'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import Code from '~/components/ui/Code';
import Reveal from '~/components/ui/Reveal';
import SectionHeading from '~/components/ui/SectionHeading';
import styles from './interceptor.module.css';

const ruleBody = `{
  "newCheckout": true,
  "darkLaunch": false
}`;

const points = [
  'Match a method exactly or with a * glob, optionally narrowed by url',
  'Answer with a result or an error, any HTTP status, and a delay',
  'One click on any row turns its real response into a rule',
  'Armed only while the panel is open — close DevTools and the page is real again'
];

export default function Interceptor() {
  const [isArmed, setIsArmed] = useState(true);

  return (
    <section id="interceptor" className={ styles.section }>
      <div className={ `container ${ styles.layout }` }>
        <div>
          <SectionHeading
            align="start"
            eyebrow="Interceptor"
            title={ <>Mock a method.<br />Leave the backend alone.</> }
          >
            Need the empty state, the error path or a slow response? Answer a JSON-RPC method from a local rule
            instead of the network — the rest of the page keeps talking to the real server.
          </SectionHeading>
          <Reveal delay={ 0.1 }>
            <ul className={ styles.points }>
              { points.map((point) => <li key={ point }>{ point }</li>) }
            </ul>
          </Reveal>
        </div>

        <Reveal delay={ 0.15 } className={ styles.demo }>
          <div className={ `${ styles.rule } ${ isArmed ? styles.armed : '' }` }>
            <div className={ styles.ruleHeader }>
              <label className={ styles.switch }>
                <input type="checkbox" checked={ isArmed } onChange={ (event) => setIsArmed(event.target.checked) } />
                <span className={ styles.track }><span className={ styles.thumb } /></span>
                <span>{ isArmed ? 'Rule armed' : 'Rule off' }</span>
              </label>
              <span className={ styles.hint }>try it →</span>
            </div>
            <div className={ styles.fields }>
              <div className={ styles.field }>
                <span className={ styles.fieldLabel }>Method</span>
                <code>getFeature*</code>
              </div>
              <div className={ styles.field }>
                <span className={ styles.fieldLabel }>Respond with</span>
                <code>result</code>
              </div>
              <div className={ styles.field }>
                <span className={ styles.fieldLabel }>Status</span>
                <code>200</code>
              </div>
              <div className={ styles.field }>
                <span className={ styles.fieldLabel }>Delay</span>
                <code>800 ms</code>
              </div>
            </div>
            <Code className={ styles.body } language="json" source={ ruleBody } />
          </div>

          <div className={ styles.resultRow }>
            <AnimatePresence mode="wait" initial={ false }>
              <motion.div
                key={ String(isArmed) }
                className={ styles.resultInner }
                initial={ { opacity: 0, y: 8 } }
                animate={ { opacity: 1, y: 0 } }
                exit={ { opacity: 0, y: -8 } }
                transition={ { duration: 0.25 } }
              >
                { isArmed && <span className={ styles.mock }>MOCK</span> }
                <span className={ styles.method }>getFeatureFlags</span>
                <span className={ styles.outcome }>
                  { isArmed ? 'answered locally · 800 ms' : 'sent to api.example.com · 143 ms' }
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
