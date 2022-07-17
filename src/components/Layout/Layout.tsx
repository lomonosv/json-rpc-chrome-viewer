import React, { useEffect } from 'react';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import RequestList from '~/components/RequestList';
import RequestInfo from '~/components/RequestInfo';
import ResponseInfo from '~/components/ResponseInfo';
import Toolbar from '~/components/Toolbar';
import Header from '~/components/common/Header';
import ZeroCase from './ZeroCase';
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
