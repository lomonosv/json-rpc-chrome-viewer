import React, { useState, useEffect } from 'react';
import Header from '~/components/common/Header';
import JsonViewer from '~/components/common/JsonViewer';
import CopyButton from '~/components/common/CopyButton';
import { IconType } from '~/components/common/Icon';
import ExpandButton from '~/components/common/ExpandButton';
import { ExpandTreeState } from '~/components/common/JsonViewer/ExpandTreeState';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import { formatJson, convertJsonToTS } from '~/logic/common/helpers';
import styles from './responseInfo.scss';

const ResponseInfo = () => {
  const { selected } = useRequestContext();
  const { expandTreeState } = useSettingsContext();
  const [expandTreeStateValue, setExpandTreeStateValue] = useState<ExpandTreeState>(expandTreeState);
  const [selectedRequest, setSelectedRequest] = useState<IRequest>(selected);

  useEffect(() => {
    setExpandTreeStateValue(expandTreeState);
    setSelectedRequest(selected);
  }, [expandTreeState, selected]);

  const json = selectedRequest.responseJSON?.result || selectedRequest.responseJSON?.error || {};
  const jsonTSRepresentation = convertJsonToTS(json);

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
        <div className={ styles.responseInfoHeaderRightSide }>
          { jsonTSRepresentation && (
            <CopyButton
              text={ convertJsonToTS(json) }
              className={ styles.convertToTSButton }
              hint="Convert to TS and Copy to clipboard"
              iconType={ IconType.Typescript }
            />
          ) }
          <CopyButton text={ formatJson(json) } />
        </div>
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
