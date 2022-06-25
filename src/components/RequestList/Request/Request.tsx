import React from 'react';
import { IRequest } from '../../../logic/HTTPArchive/IRequest';
import styles from './request.scss';

const Request = ({ data }: { data: IRequest }) => (
  <div className={ styles.request }>
    <div className={ styles.method }>
      { data.requestJSON.method }
    </div>
    <div className={ styles.url }>
      { data.request.url }
    </div>
  </div>
);

export default Request;
