import React from 'react';
import cn from 'classnames';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '../../logic/SettingsContext';
import ZeroCase from './ZeroCase';
import RequestList from '../RequestList';
import RequestInfo from '../RequestInfo';
import ResponseInfo from '../ResponseInfo';
import Toolbar from '../Toolbar';
import Header from '../common/Header';
import styles from './layout.scss';

const Layout = () => {
  const { selected, requests } = useRequestContext();
  const { isDarkTheme } = useSettingsContext();

  return (
    <div
      className={ cn(styles.layoutWrapper, {
        isDark: isDarkTheme
      }) }
    >
      <Header>
        <Toolbar />
      </Header>
      <div className={ styles.layoutContainer }>
        { !requests.length && <ZeroCase /> }
        { !!requests.length && (
          <>
            <RequestList className={ styles.leftSideContainer } />
            { !!selected && (
              <div className={ styles.rightSideContainer }>
                <RequestInfo />
                <ResponseInfo />
              </div>
            ) }
          </>
        ) }
      </div>
    </div>
  );
};

export default Layout;
