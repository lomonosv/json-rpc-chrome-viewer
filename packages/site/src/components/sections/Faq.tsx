import { faq } from '~/lib/faq';
import styles from './faq.module.css';

// Collapsed answers keep the page compact; they are in the HTML either way.
export default function Faq() {
  return (
    <section id="faq" className={ styles.section }>
      <div className="container">
        <h2 className={ styles.heading }>Questions</h2>
        <div className={ styles.list }>
          { faq.map((item) => (
            <details key={ item.question } className={ styles.item }>
              <summary className={ styles.question }>{ item.question }</summary>
              <p className={ styles.answer }>{ item.answer }</p>
            </details>
          )) }
        </div>
      </div>
    </section>
  );
}
