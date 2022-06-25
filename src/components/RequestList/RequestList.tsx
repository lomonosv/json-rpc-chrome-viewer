import React from 'react';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import Request from './Request';

const RequestList = () => {
  const { requests } = useRequestContext();

  return requests.map((data, index) => (
    <div key={ `${ data.request.url } - ${ index }` }>
      <Request data={ data }/>
    </div>
  ));
};

export default RequestList;
