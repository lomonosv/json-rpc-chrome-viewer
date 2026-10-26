import type { ReactNode } from 'react';
import Reveal from './Reveal';
import styles from './sectionHeading.module.css';

interface ISectionHeadingProps {
  eyebrow: string,
  title: ReactNode,
  children?: ReactNode,
  align?: 'center' | 'start',
}

export default function SectionHeading({ eyebrow, title, children, align = 'center' }: ISectionHeadingProps) {
  return (
    <Reveal className={ `${ styles.heading } ${ align === 'start' ? styles.start : '' }` }>
      <span className={ styles.eyebrow }>{ eyebrow }</span>
      <h2 className={ styles.title }>{ title }</h2>
      { children && <p className={ styles.lead }>{ children }</p> }
    </Reveal>
  );
}
