import React from 'react';
import cn from 'classnames';
import styles from './button.scss';

interface IComponentProps {
  onClick: () => void,
  text: string,
  className?: string
}

const Button = ({
  onClick,
  text,
  className
}: IComponentProps) => (
  <a
    className={ cn(styles.button, className) }
    onClick={ onClick }
  >
    { text }
  </a>
);

export default Button;
