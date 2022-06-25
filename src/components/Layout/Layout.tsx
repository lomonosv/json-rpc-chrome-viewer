import React from 'react';
import styles from './layout.scss';
import RequestList from '../RequestList';

const Layout = () => (
  <div className={ styles.layoutContainer }>
    <div className={ styles.leftSideContainer }>
      <RequestList />
    </div>
    <div className={ styles.rightSideContainer }>
      <div className={ styles.requestContainer }>
        Request
      </div>
      <div className={ styles.responseContainer }>
        Response
      </div>
    </div>
  </div>
);

export default Layout;
