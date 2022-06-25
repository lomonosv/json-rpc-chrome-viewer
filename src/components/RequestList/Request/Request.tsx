import React from 'react';
import cn from 'classnames';
import { useRequestContext } from '../../../logic/HTTPArchive/HttpArchiveContext';
import { IRequest } from '../../../logic/HTTPArchive/IRequest';
import styles from './request.scss';

const Request = ({ item }: { item: IRequest }) => {
  const { selected, setSelected } = useRequestContext();

  const handleClick = () => {
    setSelected(item);
  };

  return (
    <div
      className={ cn(styles.request, {
        [styles.isSelected]: item.uuid === selected?.uuid,
        [styles.error]: !!item.responseJSON?.error,
        [styles.responseNotParsed]: !item.responseJSON
      }) }
      onClick={ handleClick }
    >
      <div>
        <div className={ styles.method }>
          { item.requestJSON.method }
        </div>
        <div className={ styles.url }>
          { item.request.url }
        </div>
      </div>
    </div>
  );
};

export default Request;
