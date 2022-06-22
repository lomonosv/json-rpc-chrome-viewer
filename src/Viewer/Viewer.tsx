import React from 'react';
import HttpArchiveContext from '../logic/HTTPArchive/HttpArchiveContext';

const Viewer = () => (
  <HttpArchiveContext>
    <div>Viewer Test</div>
  </HttpArchiveContext>
);

export default Viewer;
