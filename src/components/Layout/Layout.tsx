import React from 'react';
import { Resizable } from 're-resizable';
import styles from './layout.scss';
import RequestList from '../RequestList';

const Layout = () => (
  <div className={ styles.layoutContainer }>
    <Resizable
      className={ styles.leftSideContainer }
      defaultSize={ {
        width: 200,
        height: '100%'
      } }
    >
      <RequestList />
    </Resizable>
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
