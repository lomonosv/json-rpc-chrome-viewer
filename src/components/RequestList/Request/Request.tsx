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
    <div className={ styles.requestWrapper }>
      <div
        className={ cn(styles.request, {
          [styles.isSelected]: item.uuid === selected?.uuid,
          [styles.error]: !!item.responseJSON?.error,
          [styles.responseNotParsed]: !item.responseJSON
        }) }
        onClick={ handleClick }
      >
        <div className={ styles.methodWrapper }>
          <div className={ styles.methodContainer }>
            <div className={ styles.method }>
              { item.requestJSON.method }
            </div>
            <div
              className={ cn(styles.url, {
                [styles.isCors]: item.isCors
              }) }
            >
              <span>{ item.request.url }</span>
            </div>
          </div>
        </div>
        <div className={ styles.sizeTime }>
          <div>
            { Math.ceil(item.response.content.size) }
          </div>
          <div>
            { Math.ceil(item.time) }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Request;
