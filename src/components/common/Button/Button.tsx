import React from 'react';
import cn from 'classnames';
import styles from './button.scss';

interface IComponentProps {
  children?: string | React.ReactElement,
  onClick?: () => void,
  className?: string,
  title?: string
}

const Button = ({
  children,
  onClick,
  className,
  title
}: IComponentProps) => (
  <a
    className={ cn(styles.button, className) }
    onClick={ onClick }
    title={ title }
  >
    { children }
  </a>
);

export default Button;
