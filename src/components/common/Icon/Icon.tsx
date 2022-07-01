import React from 'react';
import cn from 'classnames';
import { IconType, IconMap } from './IconType';
import styles from './icon.scss';

interface IComponentProps {
  type: IconType,
  className?: string
}

const Icon = ({ type, className }: IComponentProps) => (
  <i
    className={ cn(styles.icon, className) }
    dangerouslySetInnerHTML={ { __html: IconMap[type] } }
  />
);

export default Icon;
