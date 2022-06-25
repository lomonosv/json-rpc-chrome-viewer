import React from 'react';
import { IRequest } from '../../../logic/HTTPArchive/IRequest';

const Request = ({ data }: { data: IRequest }) => (
  <div>
    {
      // @ts-ignore
      data.requestJSON.method
    }
  </div>
);

export default Request;
