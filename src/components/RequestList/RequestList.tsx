import React, { useEffect, useRef } from 'react';
import { Resizable } from 're-resizable';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useCacheContext } from '~/logic/CacheContext/CacheContext';
import Header from '~/components/common/Header';
import Request from './Request';
import styles from './requestList.scss';

const minLeftSideWidth = 200;

interface IComponentProps {
  className?: string
}

const RequestList = ({ className }: IComponentProps) => {
  const resizableRef = useRef<Resizable>(null);
  const { requests, selected } = useRequestContext();
  const { requestListSectionWidth, updateRequestListSectionWidth } = useCacheContext();

  useEffect(() => {
    resizableRef.current.updateSize({
      width: selected ? requestListSectionWidth : '100%',
      height: '100%'
    });
  }, [selected]);

  useEffect(() => {
    resizableRef.current.updateSize({
      width: selected ? requestListSectionWidth : '100%',
      height: '100%'
    });
  }, [selected]);

  const handleResize = () => {
    updateRequestListSectionWidth(resizableRef.current.size.width);
  };

  return (
    <Resizable
      ref={ resizableRef }
      enable={ {
        top: false,
        right: !!selected,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false
      } }
      className={ className }
      minWidth={ minLeftSideWidth }
      maxWidth={ selected ? '80%' : '100%' }
      defaultSize={ {
        width: selected ? requestListSectionWidth : '100%',
        height: '100%'
      } }
      onResizeStop={ handleResize }
    >
      <div className={ styles.requestList }>
        <div className={ styles.requestsHeaderWrapper }>
          <Header className={ styles.requestsHeader }>
            <div className={ styles.methodHeader }>Method</div>
            <div className={ styles.metaHeaders }>
              <div>Status</div>
              <div>Size (B)</div>
              <div>Time (ms)</div>
            </div>
          </Header>
        </div>
        {
          requests.map((item, index) => (
            <Request
              key={ `${ item.request.url } - ${ index }` }
              item={ item }
            />
          ))
        }
      </div>
    </Resizable>
  );
};

export default RequestList;
