import React from 'react';
import styles from './layout.scss';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import RequestList from '../RequestList';
import RequestInfo from '../RequestInfo';
import ResponseInfo from '../ResponseInfo';

const Layout = () => {
  const { selected } = useRequestContext();

  return (
    <div className={ styles.layoutContainer }>
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
