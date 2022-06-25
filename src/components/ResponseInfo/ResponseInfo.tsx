import React from 'react';
import styles from './responseInfo.scss';
import Header from '../common/Header';

const ResponseInfo = () => (
  <div className={ styles.responseInfoWrapper }>
    <Header>
      <>Response</>
    </Header>
    <div className={ styles.responseInfoContainer }>
      <div className={ styles.responseInfo }>
        Tree
      </div>
    </div>
  </div>
);

export default ResponseInfo;
