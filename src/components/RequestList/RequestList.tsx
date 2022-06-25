import React, { useEffect, useRef } from 'react';
import { Resizable } from 're-resizable';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import Request from './Request';
import Header from '../common/Header';
import Button from '../common/Button';
import styles from './requestList.scss';

const minLeftSideWidth = 200;

interface IComponentProps {
  className?: string
}

const RequestList = ({ className }: IComponentProps) => {
  const resizableRef = useRef<Resizable>(null);
  const widthCache = useRef<number>(minLeftSideWidth);
  const { requests, selected, clear } = useRequestContext();

  useEffect(() => {
    resizableRef.current.updateSize({
      width: selected ? widthCache.current : '100%',
      height: '100%'
    });
  }, [selected]);

  useEffect(() => {
    resizableRef.current.updateSize({
      width: selected ? widthCache.current : '100%',
      height: '100%'
    });
  }, [selected]);

  const handleResize = () => {
    widthCache.current = resizableRef.current.size.width;
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
        width: selected ? minLeftSideWidth : '100%',
        height: '100%'
      } }
      onResizeStop={ handleResize }
    >
      { !!requests.length && (
        <Header>
          <Button
            text="Clear"
            onClick={ clear }
          />
        </Header>
      ) }
      <div className={ styles.requestList }>
        <div className={ styles.requestsHeaderWrapper }>
          <Header className={ styles.requestsHeader }>
            <div className={ styles.methodHeader }>Method</div>
            <div className={ styles.sizeTimeHeaders }>
              <div>Size</div>
              <div>Time</div>
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
