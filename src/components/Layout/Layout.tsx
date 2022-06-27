import React from 'react';
import cn from 'classnames';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '../../logic/SettingsContext';
import RequestList from '../RequestList';
import RequestInfo from '../RequestInfo';
import ResponseInfo from '../ResponseInfo';
import Button from '../common/Button';
import Header from '../common/Header';
import styles from './layout.scss';

const Layout = () => {
  const { selected, clear } = useRequestContext();
  const { isDarkTheme } = useSettingsContext();

  return (
    <div
      className={ cn(styles.layoutWrapper, {
        isDark: isDarkTheme
      }) }
    >
      <Header>
        <Button
          text="Clear"
          onClick={ clear }
        />
      </Header>
      <div className={ styles.layoutContainer }>
        <RequestList className={ styles.leftSideContainer } />
        { !!selected && (
          <div className={ styles.rightSideContainer }>
            <RequestInfo />
            <ResponseInfo />
          </div>
        ) }
      </div>
    </div>
  );
};

export default Layout;
