import React from 'react';
import Header from '../common/Header';
import JsonViewer from '../common/JsonViewer';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import styles from './responseInfo.scss';

const ResponseInfo = () => {
  const { selected } = useRequestContext();

  const json = selected.responseJSON?.result || selected.responseJSON?.error || {};

  return (
    <div className={ styles.responseInfoWrapper }>
      <Header>
        <>Response</>
      </Header>
      <div className={ styles.responseInfoContainer }>
        <JsonViewer
          src={ json }
          openNodeDepth={ 2 }
        />
      </div>
    </div>
  );
};

export default ResponseInfo;
