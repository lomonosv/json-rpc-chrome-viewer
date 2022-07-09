import React from 'react';
import cn from 'classnames';
import styles from './button.scss';

interface IComponentProps {
  children?: string | React.ReactElement,
  onClick?: () => void,
  className?: string
}

const Button = ({
  children,
  onClick,
  className
}: IComponentProps) => (
  <a
    className={ cn(styles.button, className) }
    onClick={ onClick }
  >
    { children }
  </a>
);

export default Button;
