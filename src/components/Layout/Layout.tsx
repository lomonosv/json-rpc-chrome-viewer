import React from 'react';
import cn from 'classnames';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '../../logic/SettingsContext';
import RequestList from '../RequestList';
import RequestInfo from '../RequestInfo';
import ResponseInfo from '../ResponseInfo';
import styles from './layout.scss';

const Layout = () => {
  const { selected } = useRequestContext();
  const { isDarkTheme } = useSettingsContext();

  return (
    <div
      className={ cn(styles.layoutContainer, {
        isDark: isDarkTheme
      }) }
    >
      <RequestList className={ styles.leftSideContainer } />
      { !!selected && (
        <div className={ styles.rightSideContainer }>
          <RequestInfo />
          <ResponseInfo />
        </div>
      ) }
    </div>
  );
};

export default Layout;
