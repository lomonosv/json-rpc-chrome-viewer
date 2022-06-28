import React from 'react';
import cn from 'classnames';
import styles from './button.scss';

interface IComponentProps {
  text: string | React.ReactElement,
  onClick?: () => void,
  className?: string
}

const Button = ({
  text,
  onClick,
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
