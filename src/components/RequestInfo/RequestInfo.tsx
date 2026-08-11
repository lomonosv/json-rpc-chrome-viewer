import React, { useEffect, useRef, useState } from 'react';
import { Resizable } from 're-resizable';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useCacheContext } from '~/logic/CacheContext/CacheContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import useSearchHighlight, { HighlightName } from '~/logic/common/useSearchHighlight';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import CopyButton from '~/components/common/CopyButton';
import ExpandButton from '~/components/common/ExpandButton';
import Header from '~/components/common/Header';
import JsonViewer from '~/components/common/JsonViewer';
import { ExpandTreeState } from '~/components/common/JsonViewer/ExpandTreeState';
import { expandAllLevels } from '~/components/common/JsonViewer/ExpandLevel';
import styles from './requestInfo.scss';

const RequestInfo = () => {
  const resizableRef = useRef<Resizable>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selected, clearSelection, filter } = useRequestContext();
  const { requestSectionHeight, updateRequestSectionHeight } = useCacheContext();
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

  useSearchHighlight(containerRef, HighlightName.Request, filter, caseSensitiveSearch);

  const json = selectedRequest.requestJSON.params || {};

  const handleResize = () => {
    updateRequestSectionHeight(resizableRef.current.size.height);
  };

  return (
    <Resizable
      ref={ resizableRef }
      enable={ {
        top: false,
        right: false,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false
      } }
      className={ styles.requestInfoWrapper }
      minHeight={ 28 }
      defaultSize={ {
        width: '100%',
        height: requestSectionHeight
      } }
      onResizeStop={ handleResize }
      handleClasses={ {
        bottom: styles.resizableBottomHandlerWrapper
      } }
    >
      <Header className={ styles.requestInfoHeader }>
        <div className={ styles.requestInfoHeaderLeftSide }>
          <Button
            onClick={ clearSelection }
            className={ styles.closeButton }
            title="Close"
          >
            <Icon type={ IconType.Close } />
          </Button>
          <ExpandButton
            className={ styles.expandButton }
            expandedState={ expandTreeStateValue }
            onChangeState={ handleExpandTreeStateChange }
          />
          <span>Request</span>
        </div>
        <CopyButton text={ JSON.stringify(json, null, 2) } />
      </Header>
      <div
        ref={ containerRef }
        className={ styles.requestInfoContainer }
      >
        <JsonViewer
          src={ json }
          expandTreeState={ expandTreeStateValue }
          expandLevel={ expandLevelValue }
        />
      </div>
    </Resizable>
  );
};

export default RequestInfo;
