import React from 'react';
import ReactDOM from 'react-dom/client';
import Viewer from './Viewer/Viewer';
import HttpArchiveContext from './logic/HTTPArchive/HttpArchiveContext';

ReactDOM.createRoot(document.getElementById('application')).render(
  <HttpArchiveContext>
    <Viewer />
  </HttpArchiveContext>
);
