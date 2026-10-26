import Icon, { type IconName } from '~/components/ui/Icon';
import styles from './features.module.css';

interface IFeature {
  icon: IconName,
  title: string,
  text: string,
}

// One sentence each: the live panel above already shows what these look like.
const features: IFeature[] = [
  {
    icon: 'layers',
    title: 'Calls by method',
    text: 'Zero config. Batches split into one row per call, each paired with its response by id.'
  },
  {
    icon: 'socket',
    title: 'HTTP and WebSocket',
    text: 'Socket frames land in the same list, SockJS included, with direction marked.'
  },
  {
    icon: 'timer',
    title: 'Timing waterfall',
    text: 'Queueing, DNS, connect, wait and download per call, like the Network panel.'
  },
  {
    icon: 'search',
    title: 'Search inside JSON',
    text: 'Filter by method, params, results or error codes; matches highlight in the panes.'
  },
  {
    icon: 'mask',
    title: 'Mock any method',
    text: 'Answer a method from a local rule — result or error, status, delay. Only while DevTools is open.'
  },
  {
    icon: 'server',
    title: 'Server-side calls',
    text: 'See the calls your SSR or BFF made while rendering the page, grouped above the page’s own.'
  }
];

export default function Features() {
  return (
    <section id="features" className={ styles.section }>
      <div className="container">
        <h2 className={ styles.heading }>What it does</h2>
        <ul className={ styles.grid }>
          { features.map((feature) => (
            <li key={ feature.title } className={ styles.item }>
              <span className={ styles.icon }><Icon name={ feature.icon } size={ 18 } /></span>
              <div>
                <h3 className={ styles.title }>{ feature.title }</h3>
                <p className={ styles.text }>{ feature.text }</p>
              </div>
            </li>
          )) }
        </ul>
      </div>
    </section>
  );
}
