import React from 'react';
import { Resizable } from 're-resizable';
import styles from './layout.scss';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import RequestList from '../RequestList';

const Layout = () => {
  const { selected } = useRequestContext();

  return (
    <div className={ styles.layoutContainer }>
      <Resizable
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
        className={ styles.leftSideContainer }
        minWidth={ 200 }
        size={ {
          width: selected ? 200 : '100%',
          height: '100%'
        } }
      >
        <RequestList />
      </Resizable>
      { !!selected && (
        <div className={ styles.rightSideContainer }>
          <div className={ styles.requestContainer }>
            Request
          </div>
          <div className={ styles.responseContainer }>
            Response
          </div>
        </div>
      ) }
    </div>
  );
};

export default Layout;
