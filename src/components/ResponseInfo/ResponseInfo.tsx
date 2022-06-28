import React, { } from 'react';
import Header from '../common/Header';
import JsonViewer from '../common/JsonViewer';
import CopyButton from '../common/CopyButton';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import styles from './responseInfo.scss';

const ResponseInfo = () => {
  const { selected } = useRequestContext();

  const json = selected.responseJSON?.result || selected.responseJSON?.error || {};

  return (
    <div className={ styles.responseInfoWrapper }>
      <Header className={ styles.responseInfoHeader }>
        <span>Response</span>
        <CopyButton text={ JSON.stringify(json, null, 2) } />
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
