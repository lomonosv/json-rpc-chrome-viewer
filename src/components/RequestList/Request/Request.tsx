import React from 'react';
import { useRequestContext } from '../../../logic/HTTPArchive/HttpArchiveContext';
import { IRequest } from '../../../logic/HTTPArchive/IRequest';
import styles from './request.scss';

const Request = ({ item }: { item: IRequest }) => {
  const { setSelected } = useRequestContext();

  return (
    <div
      className={ styles.request }
      onClick={ () => setSelected(item) }
    >
      <div className={ styles.method }>
        { item.requestJSON.method }
      </div>
      <div className={ styles.url }>
        { item.request.url }
      </div>
    </div>
  );
};

export default Request;
