import React, { useState, useEffect, useRef } from 'react';
import cn from 'classnames';
import Header from '~/components/common/Header';
import JsonViewer from '~/components/common/JsonViewer';
import CopyButton from '~/components/common/CopyButton';
import { IconType } from '~/components/common/Icon';
import ExpandButton from '~/components/common/ExpandButton';
import { ExpandTreeState } from '~/components/common/JsonViewer/ExpandTreeState';
import { expandAllLevels } from '~/components/common/JsonViewer/ExpandLevel';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import { formatJson, convertJsonToTS } from '~/logic/common/helpers';
import useSearchHighlight, { HighlightName } from '~/logic/common/useSearchHighlight';
import styles from './responseInfo.scss';

const ResponseInfo = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selected, filter } = useRequestContext();
  const { expandTreeState, expandLevel, caseSensitiveSearch } = useSettingsContext();
  const [expandTreeStateValue, setExpandTreeStateValue] = useState<ExpandTreeState>(expandTreeState);
  const [expandLevelValue, setExpandLevelValue] = useState<number>(expandLevel);
  const [selectedRequest, setSelectedRequest] = useState<IRequest>(selected);

  useEffect(() => {
    setExpandTreeStateValue(expandTreeState);
    setExpandLevelValue(expandLevel);
    setSelectedRequest(selected);
  }, [expandTreeState, expandLevel, selected]);

  const handleExpandTreeStateChange = (state: ExpandTreeState) => {
    setExpandTreeStateValue(state);
    setExpandLevelValue(expandAllLevels);
  };

  useSearchHighlight(containerRef, HighlightName.Response, filter, caseSensitiveSearch);

  const isJsonResponse = !selectedRequest.isWarning && !selectedRequest.isPending;
  const json = selectedRequest.responseJSON?.result || selectedRequest.responseJSON?.error || {};
  const jsonTSRepresentation = isJsonResponse && convertJsonToTS(json);
  const rawResponseText = selectedRequest.isPending ? 'Waiting for response…' : selectedRequest.rawResponse;

  return (
    <div className={ styles.responseInfoWrapper }>
      <Header className={ styles.responseInfoHeader }>
        <div className={ styles.responseInfoHeaderLeftSide }>
          { isJsonResponse && (
            <ExpandButton
              className={ styles.expandButton }
              expandedState={ expandTreeStateValue }
              onChangeState={ handleExpandTreeStateChange }
            />
          ) }
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
          <CopyButton text={ isJsonResponse ? formatJson(json) : selectedRequest.rawResponse } />
        </div>
      </Header>
      <div
        ref={ containerRef }
        className={ cn(styles.responseInfoContainer, {
          [styles.responseNotParsed]: selectedRequest.isWarning || selectedRequest.isPending
        }) }
      >
        { isJsonResponse ? (
          <JsonViewer
            src={ json }
            expandTreeState={ expandTreeStateValue }
            expandLevel={ expandLevelValue }
            defaultOpenNodesDepth={ 2 }
          />
        ) : (
          <div className={ styles.rawResponseWrapper }>
            <pre>
              {rawResponseText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseInfo;
