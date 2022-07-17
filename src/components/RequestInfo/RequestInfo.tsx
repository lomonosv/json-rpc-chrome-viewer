import React, { useEffect, useRef, useState } from 'react';
import { Resizable } from 're-resizable';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useCacheContext } from '~/logic/CacheContext/CacheContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import CopyButton from '~/components/common/CopyButton';
import ExpandButton from '~/components/common/ExpandButton';
import Header from '~/components/common/Header';
import JsonViewer from '~/components/common/JsonViewer';
import { ExpandTreeState } from '~/components/common/JsonViewer/ExpandTreeState';
import styles from './requestInfo.scss';

const RequestInfo = () => {
  const resizableRef = useRef<Resizable>(null);
  const { selected, clearSelection } = useRequestContext();
  const { requestSectionHeight, updateRequestSectionHeight } = useCacheContext();
  const { expandTreeState } = useSettingsContext();
  const [expandTreeStateValue, setExpandTreeStateValue] = useState<ExpandTreeState>(expandTreeState);
  const [selectedRequest, setSelectedRequest] = useState<IRequest>(selected);

  useEffect(() => {
    setExpandTreeStateValue(expandTreeState);
    setSelectedRequest(selected);
  }, [expandTreeState, selected]);

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
            onChangeState={ setExpandTreeStateValue }
          />
          <span>Request</span>
        </div>
        <CopyButton text={ JSON.stringify(json, null, 2) } />
      </Header>
      <div className={ styles.requestInfoContainer }>
        <JsonViewer
          src={ json }
          expandTreeState={ expandTreeStateValue }
        />
      </div>
    </Resizable>
  );
};

export default RequestInfo;
