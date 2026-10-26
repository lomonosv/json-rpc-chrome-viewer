'use client';

import CountUp from '~/components/reactbits/CountUp/CountUp';
import Icon from '~/components/ui/Icon';
import Reveal from '~/components/ui/Reveal';
import SectionHeading from '~/components/ui/SectionHeading';
import styles from './trust.module.css';

const stats = [
  { value: 5, label: 'capture paths, one list', suffix: '' },
  { value: 6, label: 'layouts for any dock', suffix: '' },
  { value: 35, label: 'JSON viewer themes', suffix: '+' },
  { value: 0, label: 'lines of config', suffix: '' }
];

const promises = [
  {
    title: 'Your traffic stays in your browser',
    text: 'Requests are read and rendered locally. Nothing you capture is sent anywhere.'
  },
  {
    title: 'No network-layer permissions',
    text: 'No webRequest, no declarativeNetRequest. Mocks are answered inside the page, only for the inspected tab.'
  },
  {
    title: 'Off means off',
    text: 'Interception is armed by the open panel itself — close DevTools and no page stays silently mocked.'
  },
  {
    title: 'Open source, MIT',
    text: 'Every line is on GitHub. Read it, build it from source, or send a pull request.'
  }
];

export default function Trust() {
  return (
    <section id="privacy" className={ styles.section }>
      <div className="container">
        <div className={ styles.stats }>
          { stats.map((stat, index) => (
            <Reveal key={ stat.label } delay={ index * 0.08 } className={ styles.stat }>
              <span className={ styles.value }>
                <CountUp to={ stat.value } from={ stat.value === 0 ? 9 : 0 } direction="up" duration={ 1.6 } />
                { stat.suffix }
              </span>
              <span className={ styles.statLabel }>{ stat.label }</span>
            </Reveal>
          )) }
        </div>

        <SectionHeading eyebrow="Privacy" title="A debugging tool you can leave installed" />

        <div className={ styles.promises }>
          { promises.map((promise, index) => (
            <Reveal key={ promise.title } delay={ index * 0.06 } className={ styles.promise }>
              <Icon name="shield" size={ 20 } className={ styles.promiseIcon } />
              <div>
                <h3>{ promise.title }</h3>
                <p>{ promise.text }</p>
              </div>
            </Reveal>
          )) }
        </div>
      </div>
    </section>
  );
}
