import React from 'react';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import Request from './Request';

const RequestList = () => {
  const { requests } = useRequestContext();

  return (
    <>{
      requests.map((item, index) => (
        <Request
          key={ `${ item.request.url } - ${ index }` }
          item={ item }
        />
      ))
    }</>
  );
};

export default RequestList;
