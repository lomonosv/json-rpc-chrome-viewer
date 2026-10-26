import DecryptedText from '~/components/reactbits/DecryptedText/DecryptedText';
import Reveal from '~/components/ui/Reveal';
import SectionHeading from '~/components/ui/SectionHeading';
import styles from './problem.module.css';

const methods = [
  'getProfile', 'eth_getBalance', 'listOrders', 'eth_call', 'getFeatureFlags', 'transfer', 'eth_blockNumber'
];

export default function Problem() {
  return (
    <section className={ styles.section }>
      <div className="container">
        <SectionHeading eyebrow="The problem" title="The Network tab was never built for RPC">
          JSON-RPC funnels every call through one url and one verb. Chrome lists a wall of identical rows,
          and the only way to find <code>transfer</code> is to click through them one by one.
        </SectionHeading>

        <div className={ styles.compare }>
          <Reveal className={ styles.card }>
            <div className={ styles.cardHeader }>
              <span className={ styles.label }>Network tab</span>
              <span className={ styles.muted }>which one failed?</span>
            </div>
            <ul className={ styles.list }>
              { methods.map((method) => (
                <li key={ method } className={ styles.dull }>
                  <span>rpc</span><span>POST</span><span>200</span><span>fetch</span>
                </li>
              )) }
            </ul>
          </Reveal>

          <div className={ styles.arrow } aria-hidden="true">→</div>

          <Reveal className={ `${ styles.card } ${ styles.cardGood }` } delay={ 0.15 }>
            <div className={ styles.cardHeader }>
              <span className={ styles.label }>JSON-RPC Viewer</span>
              <span className={ styles.good }>found it</span>
            </div>
            <ul className={ styles.list }>
              { methods.map((method) => (
                <li key={ method } className={ method === 'transfer' ? styles.error : '' }>
                  <DecryptedText
                    text={ method }
                    animateOn="view"
                    sequential
                    speed={ 40 }
                    className={ styles.method }
                    encryptedClassName={ styles.encrypted }
                  />
                  { method === 'transfer'
                    ? <span className={ styles.errorCode }>-32602</span>
                    : <span className={ styles.ok }>200</span> }
                </li>
              )) }
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
