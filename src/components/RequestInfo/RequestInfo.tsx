import React, { useRef } from 'react';
import { Resizable } from 're-resizable';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import { useCacheContext } from '../../logic/CacheContext';
import Button from '../common/Button';
import Header from '../common/Header';
import JsonViewer from '../common/JsonViewer';
import styles from './requestInfo.scss';

const RequestInfo = () => {
  const resizableRef = useRef<Resizable>(null);
  const { selected, clearSelection } = useRequestContext();
  const { requestSectionHeight, setRequestSectionHeight } = useCacheContext();

  const json = selected.requestJSON.params || {};

  const handleResize = () => {
    setRequestSectionHeight(resizableRef.current.size.height);
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
      minHeight={ 25 }
      defaultSize={ {
        width: '100%',
        height: requestSectionHeight
      } }
      onResizeStop={ handleResize }
    >
      <Header className={ styles.header }>
        <span>Request</span>
        <Button
          text="✕"
          onClick={ clearSelection }
          className={ styles.closeButton }
        />
      </Header>
      <div className={ styles.requestInfoContainer }>
        <JsonViewer src={ json } />
      </div>
    </Resizable>
  );
};

export default RequestInfo;
