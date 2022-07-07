import React from 'react';
import cn from 'classnames';
import styles from './button.scss';

interface IComponentProps {
  content?: string | React.ReactElement,
  children?: string | React.ReactElement,
  onClick?: () => void,
  className?: string
}

const Button = ({
  content,
  children,
  onClick,
  className
}: IComponentProps) => (
  <a
    className={ cn(styles.button, className) }
    onClick={ onClick }
  >
    { children || content }
  </a>
);

export default Button;
