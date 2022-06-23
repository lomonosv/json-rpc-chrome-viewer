import React from 'react';
import HttpArchiveContext from '../logic/HTTPArchive/HttpArchiveContext';

const Viewer = () => (
  <HttpArchiveContext>
    <div>Viewer</div>
  </HttpArchiveContext>
);

export default Viewer;
