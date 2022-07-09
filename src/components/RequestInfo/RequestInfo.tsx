import React, { useRef } from 'react';
import { Resizable } from 're-resizable';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import { useCacheContext } from '../../logic/CacheContext/CacheContext';
import Button from '../common/Button';
import Icon, { IconType } from '../common/Icon';
import CopyButton from '../common/CopyButton';
import Header from '../common/Header';
import JsonViewer from '../common/JsonViewer';
import styles from './requestInfo.scss';

const RequestInfo = () => {
  const resizableRef = useRef<Resizable>(null);
  const { selected, clearSelection } = useRequestContext();
  const { requestSectionHeight, updateRequestSectionHeight } = useCacheContext();

  const json = selected.requestJSON.params || {};

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
        <div>
          <Button
            onClick={ clearSelection }
            className={ styles.closeButton }
          >
            <Icon
              className={ styles.closeButtonIcon }
              type={ IconType.Close }
            />
          </Button>
          <span>Request</span>
        </div>
        <CopyButton text={ JSON.stringify(json, null, 2) } />
      </Header>
      <div className={ styles.requestInfoContainer }>
        <JsonViewer src={ json } />
      </div>
    </Resizable>
  );
};

export default RequestInfo;
