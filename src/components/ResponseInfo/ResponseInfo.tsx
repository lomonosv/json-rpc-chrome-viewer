import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import JsonViewer from '../common/JsonViewer';
import CopyButton from '../common/CopyButton';
import ExpandButton from '../common/ExpandButton';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '../../logic/SettingsContext/SettingsContext';
import { ExpandTreeState } from '../common/JsonViewer/ExpandTreeState';
import styles from './responseInfo.scss';

const ResponseInfo = () => {
  const { selected } = useRequestContext();
  const { expandTreeState } = useSettingsContext();
  const [expandTreeStateValue, setExpandTreeStateValue] = useState<ExpandTreeState>(expandTreeState);

  useEffect(() => {
    setExpandTreeStateValue(expandTreeState);
  }, [expandTreeState, selected]);

  const json = selected.responseJSON?.result || selected.responseJSON?.error || {};

  return (
    <div className={ styles.responseInfoWrapper }>
      <Header className={ styles.responseInfoHeader }>
        <div className={ styles.responseInfoHeaderLeftSide }>
          <ExpandButton
            className={ styles.expandButton }
            expandedState={ expandTreeStateValue }
            onChangeState={ setExpandTreeStateValue }
          />
          <span>Response</span>
        </div>
        <CopyButton text={ JSON.stringify(json, null, 2) } />
      </Header>
      <div className={ styles.responseInfoContainer }>
        <JsonViewer
          src={ json }
          expandTreeState={ expandTreeStateValue }
          defaultOpenNodesDepth={ 2 }
        />
      </div>
    </div>
  );
};

export default ResponseInfo;
