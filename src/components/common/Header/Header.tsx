import React from 'react';
import cn from 'classnames';
import styles from './header.scss';

interface IComponentProps {
  className?: string,
  children: React.ReactElement | React.ReactElement[]
}

const Header = ({ className, children }: IComponentProps) => (
  <div className={ cn(styles.headerContainer, className) }>
    { children }
  </div>
);

export default Header;
