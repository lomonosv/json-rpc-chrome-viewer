import React from 'react';
import styles from './settings.scss';

interface IComponentProps {
  title: string,
  description?: string,
  children: React.ReactNode,
}

const SettingsCard = ({ title, description, children }: IComponentProps) => (
  <section className={ styles.card }>
    <h4 className={ styles.cardTitle }>{ title }</h4>
    <div className={ styles.cardBody }>
      { description && <p className={ styles.cardDescription }>{ description }</p> }
      { children }
    </div>
  </section>
);

export default SettingsCard;
