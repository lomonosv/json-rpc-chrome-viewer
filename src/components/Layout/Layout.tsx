import React, { useEffect } from 'react';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '../../logic/SettingsContext/SettingsContext';
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

  useEffect(() => {
    const body = document.getElementsByTagName('body')[0];
    body.classList.remove('isDark');

    if (isDarkTheme) {
      body.classList.add('isDark');
    }
  }, []);

  return (
    <div
      className={ styles.layoutWrapper }
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
