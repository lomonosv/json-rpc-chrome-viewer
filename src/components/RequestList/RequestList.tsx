import React from 'react';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import Request from './Request';

const RequestList = () => {
  const { requests } = useRequestContext();

  return (
    <>{
      requests.map((data, index) => (
        <Request
          key={ `${ data.request.url } - ${ index }` }
          data={ data }
        />
      ))
    }</>
  );
};

export default RequestList;
